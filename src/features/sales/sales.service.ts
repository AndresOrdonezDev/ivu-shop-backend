import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductType } from '../products/enums/product-type.enum';
import { ThirdParty } from '../thirdparties/entities/third-party.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ThirdpartiesService } from '../thirdparties/thirdparties.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleStatus } from './enums/sale-status.enum';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale, 'operations')
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem, 'operations')
    private readonly itemRepo: Repository<SaleItem>,
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly thirdpartiesService: ThirdpartiesService,
    @InjectDataSource('operations')
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string): Promise<Sale[]> {
    return this.saleRepo.find({
      where: { tenantId },
      relations: ['items'],
      order: { saleDate: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async create(
    dto: CreateSaleDto,
    tenantId: string,
    userId: string,
  ): Promise<Sale> {
    if (!dto.items?.length) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // Si viene un tercero, validar que exista, sea del tenant y esté marcado como cliente
    let thirdParty: ThirdParty | null = null;
    if (dto.thirdPartyId) {
      thirdParty = await this.thirdpartiesService.findById(
        dto.thirdPartyId,
        tenantId,
      );
      if (!thirdParty.isCustomer) {
        throw new BadRequestException(
          'Third party is not marked as a customer',
        );
      }
    }

    // Cargar todos los productos y validar que pertenecen al tenant
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: productIds })
      .andWhere('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.isActive = true')
      .getMany();

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found or inactive',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validar stock suficiente para cada item (los servicios no manejan stock)
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (
        product.type === ProductType.PRODUCT &&
        product.stock < item.quantity
      ) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
        );
      }
    }

    // Preparar datos de items con snapshots de precio y costo
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const costAtSale = Number(product.averageCost);
      // RN02 de terceros: si el tercero factura a costo, se cobra costo promedio + iva en vez del precio de venta
      const unitPrice = thirdParty?.invoiceAtCost
        ? costAtSale
        : Number(product.price);
      const taxPercent = product.tax ?? 0;
      const itemDiscount = item.discount ?? 0;
      const subtotalBeforeTax = unitPrice * item.quantity - itemDiscount;
      const taxAmount = subtotalBeforeTax * (taxPercent / 100);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        costAtSale,
        taxPercent,
        discount: itemDiscount,
        subtotal: subtotalBeforeTax,
        taxAmount,
      };
    });

    // Totales de la venta
    const subtotal = itemsData.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = itemsData.reduce((sum, i) => sum + i.taxAmount, 0);
    const saleDiscount = dto.discount ?? 0;
    const total = subtotal + taxAmount - saleDiscount;

    let createdSale: Sale;

    await this.dataSource.transaction(async (manager) => {
      // 1. Crear la venta
      createdSale = await manager.save(Sale, {
        tenantId,
        thirdPartyId: dto.thirdPartyId ?? null,
        userId,
        paymentType: dto.paymentType,
        status: SaleStatus.COMPLETED,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        discount: Math.round(saleDiscount * 100) / 100,
        total: Math.round(total * 100) / 100,
        notes: dto.notes ?? null,
      });

      // 2. Crear items y descontar stock
      for (const item of itemsData) {
        await manager.save(SaleItem, {
          tenantId,
          saleId: createdSale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costAtSale: item.costAtSale,
          taxPercent: item.taxPercent,
          discount: item.discount,
          subtotal: Math.round(item.subtotal * 100) / 100,
        });

        const product = productMap.get(item.productId)!;
        if (product.type === ProductType.PRODUCT) {
          await manager.update(Product, item.productId, {
            stock: product.stock - item.quantity,
          });
        }
      }
    });

    // 3. Registrar movimientos de inventario (auditoría) — no aplica a servicios, que no manejan stock
    for (const item of itemsData) {
      const product = productMap.get(item.productId)!;
      if (product.type !== ProductType.PRODUCT) continue;
      await this.inventoryService.createMovement({
        tenantId,
        productId: item.productId,
        type: MovementType.SALE,
        quantity: -item.quantity,
        costAtMovement: item.costAtSale,
        referenceType: ReferenceType.SALE,
        referenceId: createdSale!.id,
        note: `Venta`,
        skipStockUpdate: true,
      });
    }

    return this.findById(createdSale!.id, tenantId);
  }

  async cancel(id: string, tenantId: string): Promise<Sale> {
    const sale = await this.findById(id, tenantId);

    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('Sale is already cancelled');
    }

    // Los servicios no manejan stock: se excluyen de la restauración y de los movimientos de devolución
    const productIds = sale.items.map((item) => item.productId);
    const products = await this.productRepo.find({
      where: { tenantId, id: In(productIds) },
    });
    const typeMap = new Map(products.map((p) => [p.id, p.type]));
    const stockItems = sale.items.filter(
      (item) => typeMap.get(item.productId) === ProductType.PRODUCT,
    );

    await this.dataSource.transaction(async (manager) => {
      // Marcar como cancelada
      await manager.update(Sale, id, { status: SaleStatus.CANCELLED });

      // Restaurar stock
      for (const item of stockItems) {
        await manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }
    });

    // Registrar movimientos de devolución
    for (const item of stockItems) {
      await this.inventoryService.createMovement({
        tenantId,
        productId: item.productId,
        type: MovementType.RETURN,
        quantity: item.quantity,
        costAtMovement: Number(item.costAtSale),
        referenceType: ReferenceType.SALE,
        referenceId: id,
        note: `Cancelación de venta`,
        skipStockUpdate: true,
      });
    }

    return this.findById(id, tenantId);
  }
}
