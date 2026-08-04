import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdParty } from './entities/third-party.entity';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';

export type ThirdPartyType = 'customer' | 'supplier';

@Injectable()
export class ThirdpartiesService {
  constructor(
    @InjectRepository(ThirdParty, 'operations')
    private readonly thirdPartyRepo: Repository<ThirdParty>,
  ) {}

  async findAll(tenantId: string, type?: ThirdPartyType): Promise<ThirdParty[]> {
    return this.thirdPartyRepo.find({
      where: {
        tenantId,
        isActive: true,
        ...(type === 'customer' ? { isCustomer: true } : {}),
        ...(type === 'supplier' ? { isSupplier: true } : {}),
      },
      order: { firstName: 'ASC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<ThirdParty> {
    const thirdParty = await this.thirdPartyRepo.findOne({ where: { id, tenantId } });
    if (!thirdParty) throw new NotFoundException('Third party not found');
    return thirdParty;
  }

  async create(dto: CreateThirdPartyDto, tenantId: string): Promise<ThirdParty> {
    const isCustomer = dto.isCustomer ?? false;
    const isSupplier = dto.isSupplier ?? false;
    this.validateAtLeastOneRole(isCustomer, isSupplier);
    this.validateCreditFields(isCustomer, dto.customerCreditAuthorized ?? false, dto);

    return this.thirdPartyRepo.save({
      tenantId,
      documentId: dto.documentId ?? null,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      contact: dto.contact ?? null,
      email: dto.email ?? null,
      department: dto.department ?? null,
      city: dto.city ?? null,
      address: dto.address ?? null,
      isSupplier,
      supplierCreditDays: dto.supplierCreditDays ?? null,
      isCustomer,
      customerCreditAuthorized: dto.customerCreditAuthorized ?? false,
      customerCreditDays: dto.customerCreditDays ?? null,
      customerCreditLimit: dto.customerCreditLimit ?? null,
      invoiceAtCost: dto.invoiceAtCost ?? false,
    });
  }

  async update(id: string, dto: UpdateThirdPartyDto, tenantId: string): Promise<ThirdParty> {
    const existing = await this.findById(id, tenantId);
    const isCustomer = dto.isCustomer ?? existing.isCustomer;
    const isSupplier = dto.isSupplier ?? existing.isSupplier;
    const customerCreditAuthorized = dto.customerCreditAuthorized ?? existing.customerCreditAuthorized;
    this.validateAtLeastOneRole(isCustomer, isSupplier);
    this.validateCreditFields(isCustomer, customerCreditAuthorized, {
      customerCreditDays: dto.customerCreditDays ?? existing.customerCreditDays ?? undefined,
      customerCreditLimit: dto.customerCreditLimit ?? existing.customerCreditLimit ?? undefined,
    });

    await this.thirdPartyRepo.update(id, dto);
    return this.findById(id, tenantId);
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.thirdPartyRepo.update(id, { isActive: false });
  }

  private validateAtLeastOneRole(isCustomer: boolean, isSupplier: boolean): void {
    if (!isCustomer && !isSupplier) {
      throw new BadRequestException('A third party must be marked as customer, supplier, or both');
    }
  }

  private validateCreditFields(
    isCustomer: boolean,
    customerCreditAuthorized: boolean,
    fields: { customerCreditDays?: number; customerCreditLimit?: number },
  ): void {
    if (isCustomer && customerCreditAuthorized) {
      if (fields.customerCreditDays == null || fields.customerCreditLimit == null) {
        throw new BadRequestException(
          'customerCreditDays and customerCreditLimit are required when customerCreditAuthorized is true',
        );
      }
    }
  }
}
