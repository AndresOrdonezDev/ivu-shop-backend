import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductLine } from './entities/product-line.entity';
import { ProductBarcode } from './entities/product-barcode.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { PurchaseInvoiceItem } from '../purchases/entities/purchase-invoice-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';
import { ProductType } from './enums/product-type.enum';

export type ProductLineWithStats = ProductLine & {
  productCount: number;
  hasMovements: boolean;
};

export type ProductWithStats = Product & {
  hasMovements: boolean;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductLine, 'operations')
    private readonly lineRepo: Repository<ProductLine>,
    @InjectRepository(ProductBarcode, 'operations')
    private readonly barcodeRepo: Repository<ProductBarcode>,
    @InjectRepository(SaleItem, 'operations')
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(PurchaseInvoiceItem, 'operations')
    private readonly purchaseItemRepo: Repository<PurchaseInvoiceItem>,
    @InjectRepository(InventoryMovement, 'operations')
    private readonly movementRepo: Repository<InventoryMovement>,
    private readonly inventoryService: InventoryService,
  ) {}

  // ─── Lines ────────────────────────────────────────────────────────────────────

  async findAllLines(tenantId: string): Promise<ProductLineWithStats[]> {
    const lines = await this.lineRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });

    const counts: { lineId: string; count: string }[] = await this.productRepo
      .createQueryBuilder('p')
      .select('p.lineId', 'lineId')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.lineId IS NOT NULL')
      .groupBy('p.lineId')
      .getRawMany();

    const saleLineIds: { lineId: string }[] = await this.saleItemRepo
      .createQueryBuilder('si')
      .innerJoin('products', 'p', 'p.id = si.productId')
      .select('DISTINCT p.lineId', 'lineId')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.lineId IS NOT NULL')
      .getRawMany();

    const purchaseLineIds: { lineId: string }[] = await this.purchaseItemRepo
      .createQueryBuilder('pi')
      .innerJoin('pi.product', 'p')
      .select('DISTINCT p.lineId', 'lineId')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.lineId IS NOT NULL')
      .getRawMany();

    const countByLine = new Map(counts.map((c) => [c.lineId, Number(c.count)]));
    const linesWithMovements = new Set([
      ...saleLineIds.map((r) => r.lineId),
      ...purchaseLineIds.map((r) => r.lineId),
    ]);

    return lines.map((line) => ({
      ...line,
      productCount: countByLine.get(line.id) ?? 0,
      hasMovements: linesWithMovements.has(line.id),
    }));
  }

  async createLine(dto: CreateLineDto, tenantId: string): Promise<ProductLine> {
    return this.lineRepo.save({ name: dto.name, tenantId });
  }

  async updateLine(
    id: string,
    dto: CreateLineDto,
    tenantId: string,
  ): Promise<ProductLine> {
    const line = await this.lineRepo.findOne({ where: { id, tenantId } });
    if (!line) throw new NotFoundException('Line not found');
    await this.assertLineHasNoMovements(id, tenantId);
    await this.lineRepo.update(id, { name: dto.name });
    return this.lineRepo.findOneByOrFail({ id });
  }

  async deleteLine(id: string, tenantId: string): Promise<void> {
    const line = await this.lineRepo.findOne({ where: { id, tenantId } });
    if (!line) throw new NotFoundException('Line not found');
    await this.assertLineHasNoMovements(id, tenantId);
    await this.lineRepo.delete(id);
  }

  private async assertLineHasNoMovements(
    lineId: string,
    tenantId: string,
  ): Promise<void> {
    const [hasSales, hasPurchases] = await Promise.all([
      this.saleItemRepo
        .createQueryBuilder('si')
        .innerJoin('products', 'p', 'p.id = si.productId')
        .where('p.lineId = :lineId', { lineId })
        .andWhere('p.tenantId = :tenantId', { tenantId })
        .getExists(),
      this.purchaseItemRepo
        .createQueryBuilder('pi')
        .innerJoin('pi.product', 'p')
        .where('p.lineId = :lineId', { lineId })
        .andWhere('p.tenantId = :tenantId', { tenantId })
        .getExists(),
    ]);
    if (hasSales || hasPurchases) {
      throw new BadRequestException(
        'No se puede editar ni eliminar la línea: tiene productos con movimientos de compra o venta',
      );
    }
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string): Promise<ProductWithStats[]> {
    const products = await this.productRepo.find({
      where: { tenantId },
      relations: ['line', 'barcodes'],
      order: { name: 'ASC' },
    });

    const saleProductIds: { productId: string }[] = await this.saleItemRepo
      .createQueryBuilder('si')
      .select('DISTINCT si.productId', 'productId')
      .where('si.tenantId = :tenantId', { tenantId })
      .getRawMany();

    const purchaseProductIds: { productId: string }[] =
      await this.purchaseItemRepo
        .createQueryBuilder('pi')
        .select('DISTINCT pi.productId', 'productId')
        .where('pi.tenantId = :tenantId', { tenantId })
        .getRawMany();

    const withMovements = new Set([
      ...saleProductIds.map((r) => r.productId),
      ...purchaseProductIds.map((r) => r.productId),
    ]);

    return products.map((p) => ({
      ...p,
      hasMovements: withMovements.has(p.id),
    }));
  }

  async findById(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenantId },
      relations: ['line', 'barcodes'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ─── Barcode lookup — optimizado para POS ────────────────────────────────────

  async findByBarcode(barcode: string, tenantId: string): Promise<Product> {
    const entry = await this.barcodeRepo.findOne({
      where: { barcode, tenantId },
      relations: ['product', 'product.line'],
    });
    if (!entry || !entry.product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return entry.product;
  }

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto, tenantId: string): Promise<Product> {
    const cost = dto.cost ?? 0;
    const isVariablePrice = dto.isVariablePrice ?? false;
    const price = isVariablePrice ? 0 : dto.price!;
    const type = dto.type ?? ProductType.PRODUCT;
    if (!isVariablePrice) {
      this.assertCostNotGreaterThanPrice(cost, price);
    }
    this.assertNoBarcodesForService(type, dto.barcodes);
    const product = await this.productRepo.save({
      tenantId,
      type: dto.type ?? undefined,
      name: dto.name,
      description: dto.description ?? null,
      refFabrica: dto.refFabrica ?? null,
      price,
      isVariablePrice,
      cost,
      averageCost: cost,
      tax: dto.tax ?? 0,
      minStock: dto.minStock ?? 0,
      lineId: dto.lineId ?? null,
      stock: 0, // siempre empieza en 0, el movimiento INITIAL lo actualiza
    });

    if (dto.barcodes?.length) {
      this.assertNoDuplicateBarcodes(dto.barcodes);
      await this.saveBarcodes(product.id, tenantId, dto.barcodes);
    }

    if (dto.initialStock && dto.initialStock > 0) {
      await this.inventoryService.createMovement({
        tenantId,
        productId: product.id,
        type: MovementType.INITIAL,
        quantity: dto.initialStock,
        costAtMovement: cost,
        referenceType: ReferenceType.MANUAL,
        note: 'Stock inicial',
      });
    }

    return this.findById(product.id, tenantId);
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateProductDto,
    tenantId: string,
  ): Promise<Product> {
    const existing = await this.findById(id, tenantId);
    const { barcodes, ...fields } = dto;

    const effectiveIsVariablePrice =
      fields.isVariablePrice ?? existing.isVariablePrice;
    const effectiveType = fields.type ?? existing.type;

    if (effectiveIsVariablePrice) {
      fields.price = 0;
    } else if (fields.cost !== undefined || fields.price !== undefined) {
      const effectiveCost = fields.cost ?? existing.cost;
      const effectivePrice = fields.price ?? existing.price;
      this.assertCostNotGreaterThanPrice(
        Number(effectiveCost),
        Number(effectivePrice),
      );
    }
    this.assertNoBarcodesForService(effectiveType, barcodes);

    if (Object.keys(fields).length) {
      await this.productRepo.update(id, fields);
    }

    if (barcodes !== undefined) {
      if (barcodes.length) this.assertNoDuplicateBarcodes(barcodes);
      await this.barcodeRepo.delete({ productId: id, tenantId });
      if (barcodes.length) {
        await this.saveBarcodes(id, tenantId, barcodes);
      }
    } else if (
      effectiveType === ProductType.SERVICE &&
      existing.barcodes?.length
    ) {
      await this.barcodeRepo.delete({ productId: id, tenantId });
    }

    return this.findById(id, tenantId);
  }

  private assertCostNotGreaterThanPrice(cost: number, price: number): void {
    if (cost > price) {
      throw new BadRequestException(
        'El costo no puede ser mayor al precio de venta',
      );
    }
  }

  private assertNoBarcodesForService(
    type: ProductType,
    barcodes?: string[],
  ): void {
    if (type === ProductType.SERVICE && barcodes?.length) {
      throw new BadRequestException(
        'Los servicios no pueden tener códigos de barras',
      );
    }
  }

  private assertNoDuplicateBarcodes(barcodes: string[]): void {
    if (new Set(barcodes).size !== barcodes.length) {
      throw new BadRequestException(
        'Códigos de barras duplicados en la solicitud',
      );
    }
  }

  private async saveBarcodes(
    productId: string,
    tenantId: string,
    barcodes: string[],
  ): Promise<void> {
    try {
      await this.barcodeRepo.save(
        barcodes.map((barcode) => ({ tenantId, productId, barcode })),
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new BadRequestException(
          'Uno de los códigos de barras ya está en uso por otro producto',
        );
      }
      throw error;
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.assertProductHasNoMovements(id, tenantId);
    await this.movementRepo.delete({ productId: id, tenantId });
    await this.productRepo.delete(id);
  }

  private async assertProductHasNoMovements(
    productId: string,
    tenantId: string,
  ): Promise<void> {
    const [hasSales, hasPurchases] = await Promise.all([
      this.saleItemRepo
        .createQueryBuilder('si')
        .where('si.productId = :productId', { productId })
        .andWhere('si.tenantId = :tenantId', { tenantId })
        .getExists(),
      this.purchaseItemRepo
        .createQueryBuilder('pi')
        .where('pi.productId = :productId', { productId })
        .andWhere('pi.tenantId = :tenantId', { tenantId })
        .getExists(),
    ]);
    if (hasSales || hasPurchases) {
      throw new BadRequestException(
        'No se puede eliminar el producto: ya tiene movimientos de compra o venta',
      );
    }
  }
}
