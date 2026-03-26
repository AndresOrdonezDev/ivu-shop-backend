import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier, 'operations')
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  async findAll(tenantId: string): Promise<Supplier[]> {
    return this.supplierRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Supplier> {
    const supplier = await this.supplierRepo.findOne({ where: { id, tenantId } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDto, tenantId: string): Promise<Supplier> {
    return this.supplierRepo.save({
      tenantId,
      name: dto.name,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
    });
  }

  async update(id: string, dto: UpdateSupplierDto, tenantId: string): Promise<Supplier> {
    await this.findById(id, tenantId);
    await this.supplierRepo.update(id, dto);
    return this.findById(id, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.supplierRepo.update(id, { isActive: false });
  }
}
