import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductBarcode } from './entities/product-barcode.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { InventoryService } from '../inventory/inventory.service';
import { MovementType } from '../inventory/enums/movement-type.enum';
import { ReferenceType } from '../inventory/enums/reference-type.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory, 'operations')
    private readonly categoryRepo: Repository<ProductCategory>,
    @InjectRepository(ProductBarcode, 'operations')
    private readonly barcodeRepo: Repository<ProductBarcode>,
    private readonly inventoryService: InventoryService,
  ) {}

  // ─── Categories ───────────────────────────────────────────────────────────────

  async findAllCategories(tenantId: string): Promise<ProductCategory[]> {
    return this.categoryRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createCategory(dto: CreateCategoryDto, tenantId: string): Promise<ProductCategory> {
    return this.categoryRepo.save({ name: dto.name, tenantId });
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.delete(id);
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { tenantId, isActive: true },
      relations: ['categories', 'barcodes'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, tenantId },
      relations: ['categories', 'barcodes'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ─── Barcode lookup — optimizado para POS ────────────────────────────────────

  async findByBarcode(barcode: string, tenantId: string): Promise<Product> {
    const entry = await this.barcodeRepo.findOne({
      where: { barcode, tenantId },
      relations: ['product', 'product.categories'],
    });
    if (!entry || !entry.product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return entry.product;
  }

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto, tenantId: string): Promise<Product> {
    const product = await this.productRepo.save({
      tenantId,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      cost: dto.cost ?? 0,
      tax: dto.tax ?? 0,
      minStock: dto.minStock ?? 0,
      stock: 0, // siempre empieza en 0, el movimiento INITIAL lo actualiza
    });

    if (dto.categoryIds?.length) {
      const categories = await this.categoryRepo.findBy({
        id: In(dto.categoryIds),
        tenantId,
      });
      product.categories = categories;
      await this.productRepo.save(product);
    }

    if (dto.barcodes?.length) {
      await this.barcodeRepo.save(
        dto.barcodes.map((barcode) => ({ tenantId, productId: product.id, barcode })),
      );
    }

    if (dto.initialStock && dto.initialStock > 0) {
      await this.inventoryService.createMovement({
        tenantId,
        productId: product.id,
        type: MovementType.INITIAL,
        quantity: dto.initialStock,
        costAtMovement: dto.cost ?? 0,
        referenceType: ReferenceType.MANUAL,
        note: 'Stock inicial',
      });
    }

    return this.findById(product.id, tenantId);
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProductDto, tenantId: string): Promise<Product> {
    const product = await this.findById(id, tenantId);
    const { categoryIds, barcodes, ...fields } = dto;

    if (Object.keys(fields).length) {
      await this.productRepo.update(id, fields);
    }

    if (categoryIds !== undefined) {
      const categories = categoryIds.length
        ? await this.categoryRepo.findBy({ id: In(categoryIds), tenantId })
        : [];
      product.categories = categories;
      await this.productRepo.save(product);
    }

    if (barcodes !== undefined) {
      await this.barcodeRepo.delete({ productId: id, tenantId });
      if (barcodes.length) {
        await this.barcodeRepo.save(
          barcodes.map((barcode) => ({ tenantId, productId: id, barcode })),
        );
      }
    }

    return this.findById(id, tenantId);
  }

  // ─── Deactivate ───────────────────────────────────────────────────────────────

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.productRepo.update(id, { isActive: false });
  }
}
