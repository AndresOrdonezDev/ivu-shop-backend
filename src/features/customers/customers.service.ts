import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer, 'operations')
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async findAll(tenantId: string): Promise<Customer[]> {
    return this.customerRepo.find({
      where: { tenantId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto, tenantId: string): Promise<Customer> {
    return this.customerRepo.save({
      tenantId,
      name: dto.name,
      documentId: dto.documentId ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      notes: dto.notes ?? null,
    });
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string): Promise<Customer> {
    await this.findById(id, tenantId);
    await this.customerRepo.update(id, dto);
    return this.findById(id, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.customerRepo.update(id, { isActive: false });
  }
}
