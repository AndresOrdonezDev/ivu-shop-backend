import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Tenant } from './entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { Plan } from '../plans/entities/plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { MailService } from '../mail/mail.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Role } from '../common/enums/role.enum';
import { SubscriptionStatus } from '../common/enums/subscription-status.enum';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Create — onboarding completo en transacción ─────────────────────────────

  async create(dto: CreateTenantDto): Promise<{ message: string; tenantId: string; slug: string }> {
    // Validaciones previas fuera de la transacción
    const [existingTenantEmail, existingUserEmail] = await Promise.all([
      this.tenantRepo.findOne({ where: { email: dto.email } }),
      this.userRepo.findOne({ where: { email: dto.ownerEmail } }),
    ]);

    if (existingTenantEmail) {
      throw new ConflictException('Business email already in use');
    }
    if (existingUserEmail) {
      throw new ConflictException('Owner email already in use');
    }

    const slug = this.generateSlug(dto.name);
    const existingSlug = await this.tenantRepo.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(
        'Business name already taken, please choose a different name',
      );
    }

    const plan = await this.planRepo.findOne({
      where: { isActive: true, isPublic: true },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
    if (!plan) throw new NotFoundException('No active plans available');

    const hashedPassword = await bcrypt.hash(dto.ownerPassword, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let createdTenant!: Tenant;

    await this.dataSource.transaction(async (manager) => {
      // 1. Crear el tenant
      createdTenant = await manager.save(Tenant, {
        name: dto.name,
        slug,
        businessType: dto.businessType,
        ownerName: dto.ownerName,
        email: dto.email,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        country: dto.country ?? 'Colombia',
        trialEndsAt: trialEndDate,
      });

      // 2. Crear el usuario owner
      await manager.save(User, {
        tenantId: createdTenant.id,
        email: dto.ownerEmail,
        password: hashedPassword,
        firstName: dto.ownerFirstName,
        lastName: dto.ownerLastName,
        role: Role.OWNER,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiresAt: verificationTokenExpiry,
      });

      // 3. Crear la suscripción trial
      await manager.save(Subscription, {
        tenantId: createdTenant.id,
        planId: plan.id,
        status: SubscriptionStatus.TRIAL,
        startDate: now,
        trialStartDate: now,
        trialEndDate,
      });
    });

    // 4. Enviar email de verificación (fuera de la transacción)
    await this.mailService.sendVerificationEmail(
      dto.ownerEmail,
      dto.ownerFirstName,
      verificationToken,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      tenantId: createdTenant.id,
      slug: createdTenant.slug,
    };
  }

  // ─── Find ─────────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    return tenant;
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.findById(id);
    await this.tenantRepo.update(id, dto);
    return this.findById(id);
  }

  // ─── Deactivate ───────────────────────────────────────────────────────────────

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantRepo.update(id, { isActive: false });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
