import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { Egreso } from './entities/egreso.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryService } from '../inventory/inventory.service';
import { ThirdpartiesService } from '../thirdparties/thirdparties.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { PaymentType } from './enums/payment-type.enum';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { EgresoPaymentMethod } from './enums/egreso-payment-method.enum';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(PurchaseInvoice, 'operations')
    private readonly invoiceRepo: Repository<PurchaseInvoice>,
    @InjectRepository(PurchaseInvoiceItem, 'operations')
    private readonly itemRepo: Repository<PurchaseInvoiceItem>,
    @InjectRepository(Egreso, 'operations')
    private readonly egresoRepo: Repository<Egreso>,
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    private readonly inventoryService: InventoryService,
    private readonly thirdpartiesService: ThirdpartiesService,
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
        {
          tenantId,
          paymentType: PaymentType.CREDIT,
          status: PurchaseStatus.PENDING,
        },
        {
          tenantId,
          paymentType: PaymentType.CREDIT,
          status: PurchaseStatus.PARTIAL,
        },
      ],
      relations: ['items'],
      order: { dueDate: 'ASC' },
    });
  }

  async create(
    dto: CreatePurchaseDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseInvoice> {
    if (!dto.items?.length) {
      throw new BadRequestException('Invoice must have at least one item');
    }

    // Validar que el tercero exista, sea del tenant y esté marcado como proveedor
    const thirdParty = await this.thirdpartiesService.findById(
      dto.thirdPartyId,
      tenantId,
    );
    if (!thirdParty.isSupplier) {
      throw new BadRequestException('Third party is not marked as a supplier');
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
        thirdPartyId: dto.thirdPartyId,
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
        const currentAverageCost = Number(product.averageCost);
        const newAverageCost =
          currentStock + item.quantity > 0
            ? (currentStock * currentAverageCost +
                item.quantity * item.unitCost) /
              (currentStock + item.quantity)
            : item.unitCost;

        // Actualizar costo (último costo de compra), costo promedio y stock del producto
        await manager.update(Product, item.productId, {
          cost: item.unitCost,
          averageCost: Math.round(newAverageCost * 100) / 100,
          stock: currentStock + item.quantity,
        });
      }

      // RN04a: una factura de contado genera automáticamente su egreso, igual que un pago normal
      if (dto.paymentType === PaymentType.CASH) {
        const consecutivo = await this.nextEgresoConsecutivo(manager, tenantId);
        await manager.save(Egreso, {
          tenantId,
          consecutivo,
          fecha: new Date(dto.invoiceDate),
          thirdPartyId: dto.thirdPartyId,
          invoiceId: createdInvoice.id,
          valorPagado: total,
          formaPago: EgresoPaymentMethod.CASH,
          valorDeduccion: 0,
          conceptoDeduccion: null,
          elaboradoPor: userId,
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

  // ─── Egresos: pagos de facturas de compra a crédito ──────────────────────────

  async findPayments(invoiceId: string, tenantId: string): Promise<Egreso[]> {
    await this.findById(invoiceId, tenantId);
    return this.egresoRepo.find({
      where: { invoiceId, tenantId },
      order: { fecha: 'ASC', createdAt: 'ASC' },
    });
  }

  async registerPayment(
    invoiceId: string,
    dto: RegisterPaymentDto,
    tenantId: string,
    userId: string,
  ): Promise<PurchaseInvoice> {
    const invoice = await this.findById(invoiceId, tenantId);

    if (invoice.paymentType !== PaymentType.CREDIT) {
      throw new BadRequestException(
        'Only credit invoices can receive payments',
      );
    }
    if (invoice.status === PurchaseStatus.PAID) {
      throw new BadRequestException('Invoice is already fully paid');
    }
    if (invoice.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException(
        'Cannot register a payment on a cancelled invoice',
      );
    }

    const existingPayments = await this.egresoRepo.find({
      where: { invoiceId, tenantId },
    });
    const paidSoFar = existingPayments.reduce(
      (sum, p) => sum + Number(p.valorPagado) + Number(p.valorDeduccion),
      0,
    );
    const balance = Number(invoice.total) - paidSoFar;
    const thisPayment = dto.valorPagado + (dto.valorDeduccion ?? 0);

    if (thisPayment > balance + 0.01) {
      throw new BadRequestException(
        `Payment exceeds the pending balance (${balance.toFixed(2)})`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const consecutivo = await this.nextEgresoConsecutivo(manager, tenantId);

      await manager.save(Egreso, {
        tenantId,
        consecutivo,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        thirdPartyId: invoice.thirdPartyId,
        invoiceId,
        valorPagado: dto.valorPagado,
        formaPago: dto.formaPago,
        valorDeduccion: dto.valorDeduccion ?? 0,
        conceptoDeduccion: dto.conceptoDeduccion ?? null,
        elaboradoPor: userId,
      });

      const newStatus =
        balance - thisPayment <= 0.01
          ? PurchaseStatus.PAID
          : PurchaseStatus.PARTIAL;
      await manager.update(PurchaseInvoice, invoiceId, { status: newStatus });
    });

    return this.findById(invoiceId, tenantId);
  }

  // Serializa la asignación de consecutivo por tenant con un advisory lock transaccional,
  // evitando que dos pagos concurrentes lean el mismo count() antes del commit.
  private async nextEgresoConsecutivo(
    manager: EntityManager,
    tenantId: string,
  ): Promise<number> {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      tenantId,
    ]);
    const count = await manager.count(Egreso, { where: { tenantId } });
    return count + 1;
  }

  // ─── Anulación ────────────────────────────────────────────────────────────────

  async cancel(id: string, tenantId: string): Promise<PurchaseInvoice> {
    const invoice = await this.findById(id, tenantId);

    // RN01: no se permite anular facturas que ya cuenten con estado pagada o pago parcial.
    if (
      invoice.status === PurchaseStatus.PAID ||
      invoice.status === PurchaseStatus.PARTIAL
    ) {
      throw new BadRequestException(
        'Cannot cancel an invoice that has already been paid or partially paid',
      );
    }
    if (invoice.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    await this.invoiceRepo.update(id, { status: PurchaseStatus.CANCELLED });
    return this.findById(id, tenantId);
  }
}
