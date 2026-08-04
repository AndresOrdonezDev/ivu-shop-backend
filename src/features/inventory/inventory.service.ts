import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Product } from '../products/entities/product.entity';
import { MovementType } from './enums/movement-type.enum';
import { ReferenceType } from './enums/reference-type.enum';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement, 'operations')
    private readonly movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
  ) {}

  // Llamado internamente por otros servicios (products, purchases, sales)
  async createMovement(data: {
    tenantId: string;
    productId: string;
    type: MovementType;
    quantity: number;
    costAtMovement: number;
    referenceType?: ReferenceType;
    referenceId?: string;
    note?: string;
    skipStockUpdate?: boolean;
  }): Promise<InventoryMovement> {
    // Actualizar stock del producto (saltar si el caller ya lo hizo en transacción)
    if (!data.skipStockUpdate) {
      await this.productRepo
        .createQueryBuilder()
        .update(Product)
        .set({ stock: () => `stock + ${data.quantity}` })
        .where('id = :id AND "tenantId" = :tenantId', {
          id: data.productId,
          tenantId: data.tenantId,
        })
        .execute();
    }

    // Registrar el movimiento
    return this.movementRepo.save({
      tenantId: data.tenantId,
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      costAtMovement: data.costAtMovement,
      referenceType: data.referenceType ?? null,
      referenceId: data.referenceId ?? null,
      note: data.note ?? null,
    });
  }

  async findByProduct(productId: string, tenantId: string): Promise<InventoryMovement[]> {
    const product = await this.productRepo.findOne({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.movementRepo.find({
      where: { productId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLowStock(tenantId: string): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.isActive = true')
      .andWhere('p.stock <= p.minStock')
      .orderBy('p.stock', 'ASC')
      .getMany();
  }

  async adjust(dto: AdjustInventoryDto, tenantId: string): Promise<InventoryMovement> {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, tenantId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const newStock = product.stock + dto.quantity;
    if (newStock < 0) {
      throw new BadRequestException('Adjustment would result in negative stock');
    }

    return this.createMovement({
      tenantId,
      productId: dto.productId,
      type: MovementType.ADJUSTMENT,
      quantity: dto.quantity,
      costAtMovement: product.averageCost,
      referenceType: ReferenceType.MANUAL,
      note: dto.note,
    });
  }
}
