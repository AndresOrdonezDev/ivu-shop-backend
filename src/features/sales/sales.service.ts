import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from '../inventory/inventory.service';
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

  async create(dto: CreateSaleDto, tenantId: string, userId: string): Promise<Sale> {
    if (!dto.items?.length) {
      throw new BadRequestException('Sale must have at least one item');
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
      throw new BadRequestException('One or more products not found or inactive');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validar stock suficiente para cada item
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
        );
      }
    }

    // Preparar datos de items con snapshots de precio y costo
    const itemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = Number(product.price);
      const costAtSale = Number(product.cost);
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
        customerId: dto.customerId ?? null,
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
        await manager.update(Product, item.productId, {
          stock: product.stock - item.quantity,
        });
      }
    });

    // 3. Registrar movimientos de inventario (auditoría)
    for (const item of itemsData) {
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

    await this.dataSource.transaction(async (manager) => {
      // Marcar como cancelada
      await manager.update(Sale, id, { status: SaleStatus.CANCELLED });

      // Restaurar stock
      for (const item of sale.items) {
        await manager.increment(Product, { id: item.productId }, 'stock', item.quantity);
      }
    });

    // Registrar movimientos de devolución
    for (const item of sale.items) {
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
