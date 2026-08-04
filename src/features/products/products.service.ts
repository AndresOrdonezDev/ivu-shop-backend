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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductLine, 'operations')
    private readonly lineRepo: Repository<ProductLine>,
    @InjectRepository(ProductBarcode, 'operations')
    private readonly barcodeRepo: Repository<ProductBarcode>,
    private readonly inventoryService: InventoryService,
  ) {}

  // ─── Lines ────────────────────────────────────────────────────────────────────

  async findAllLines(tenantId: string): Promise<ProductLine[]> {
    return this.lineRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createLine(dto: CreateLineDto, tenantId: string): Promise<ProductLine> {
    return this.lineRepo.save({ name: dto.name, tenantId });
  }

  async deleteLine(id: string, tenantId: string): Promise<void> {
    const line = await this.lineRepo.findOne({ where: { id, tenantId } });
    if (!line) throw new NotFoundException('Line not found');
    await this.lineRepo.delete(id);
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { tenantId, isActive: true },
      relations: ['line', 'barcodes'],
      order: { name: 'ASC' },
    });
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
    const product = await this.productRepo.save({
      tenantId,
      type: dto.type ?? undefined,
      name: dto.name,
      description: dto.description ?? null,
      refFabrica: dto.refFabrica ?? null,
      price: dto.price,
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
    await this.findById(id, tenantId);
    const { barcodes, ...fields } = dto;

    if (Object.keys(fields).length) {
      await this.productRepo.update(id, fields);
    }

    if (barcodes !== undefined) {
      if (barcodes.length) this.assertNoDuplicateBarcodes(barcodes);
      await this.barcodeRepo.delete({ productId: id, tenantId });
      if (barcodes.length) {
        await this.saveBarcodes(id, tenantId, barcodes);
      }
    }

    return this.findById(id, tenantId);
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

  // ─── Deactivate ───────────────────────────────────────────────────────────────

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.productRepo.update(id, { isActive: false });
  }
}
