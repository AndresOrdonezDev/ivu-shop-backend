import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
import { PaymentType } from './enums/payment-type.enum';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseInvoice, 'operations')
    private readonly invoiceRepo: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem, 'operations')
    private readonly itemRepo: Repository<PurchaseInvoiceItem>,
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
    @InjectDataSource('operations')
    private readonly dataSource: DataSource,
  ) {}

  async findAll(tenantId: string): Promise<PurchaseInvoice[]> {
    return this.invoiceRepo.find({
      where: { tenantId },
      relations: ['items', 'items.product'],
      order: { invoiceDate: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<PurchaseInvoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.product'],
    });
    if (!invoice) throw new NotFoundException('Purchase invoice not found');
    return invoice;
  }

  async findPending(tenantId: string): Promise<PurchaseInvoice[]> {
    return this.invoiceRepo.find({
      where: [
        { tenantId, status: PurchaseStatus.PENDING },
        { tenantId, status: PurchaseStatus.PARTIAL },
      ],
      relations: ['items'],
      order: { dueDate: 'ASC' },
    });
  }

  async create(dto: CreatePurchaseDto, tenantId: string): Promise<PurchaseInvoice> {
    if (!dto.items?.length) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Validar que todos los productos existen y pertenecen al tenant
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: productIds })
      .andWhere('p.tenantId = :tenantId', { tenantId })
      .getMany();

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;

    const itemsData = dto.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitCost;
      const itemTax = itemSubtotal * ((item.taxPercent ?? 0) / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
      return { ...item, subtotal: itemSubtotal };
    });

    const total = subtotal + taxAmount;
    const status =
      dto.paymentType === PaymentType.CASH
        ? PurchaseStatus.PAID
        : PurchaseStatus.PENDING;

    // Transacción: guardar invoice + items + actualizar productos + crear movimientos
    let createdInvoice: PurchaseInvoice;

    await this.dataSource.transaction(async (manager) => {
      // 1. Crear la factura
      createdInvoice = await manager.save(PurchaseInvoice, {
        tenantId,
        supplierId: dto.supplierId,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paymentType: dto.paymentType,
        status,
        subtotal,
        taxAmount,
        total,
        notes: dto.notes ?? null,
      });

      // 2. Crear items y actualizar costo promedio ponderado
      for (const item of itemsData) {
        await manager.save(PurchaseInvoiceItem, {
          tenantId,
          invoiceId: createdInvoice.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          taxPercent: item.taxPercent ?? 0,
          subtotal: item.subtotal,
        });

        // Costo promedio ponderado
        const product = productMap.get(item.productId)!;
        const currentStock = product.stock;
        const currentCost = Number(product.cost);
        const newCost =
          currentStock + item.quantity > 0
            ? (currentStock * currentCost + item.quantity * item.unitCost) /
              (currentStock + item.quantity)
            : item.unitCost;

        // Actualizar costo y stock del producto en la transacción
        await manager.update(Product, item.productId, {
          cost: Math.round(newCost * 100) / 100,
          stock: currentStock + item.quantity,
        });
      }
    });

    // 3. Crear movimientos de inventario (fuera de la transacción principal)
    for (const item of itemsData) {
      await this.inventoryService.createMovement({
        tenantId,
        productId: item.productId,
        type: MovementType.ENTRY,
        quantity: item.quantity,
        costAtMovement: item.unitCost,
        referenceType: ReferenceType.PURCHASE,
        referenceId: createdInvoice!.id,
        note: `Factura de compra ${dto.invoiceNumber}`,
        skipStockUpdate: true,
      });
    }

    return this.findById(createdInvoice!.id, tenantId);
  }

  async updateStatus(
    id: string,
    dto: UpdatePurchaseStatusDto,
    tenantId: string,
  ): Promise<PurchaseInvoice> {
    await this.findById(id, tenantId);
    await this.invoiceRepo.update(id, { status: dto.status });
    return this.findById(id, tenantId);
  }
}
