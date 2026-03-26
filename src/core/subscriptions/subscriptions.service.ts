import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';

@Injectable()
export class SubscriptionsService {
  private readonly TRIAL_DAYS = 7;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
  ) {}

  async createTrial(tenantId: string, planId: string): Promise<Subscription> {
    const now = new Date();
    const trialEndDate = new Date(
      now.getTime() + this.TRIAL_DAYS * 24 * 60 * 60 * 1000,
    );

    return this.subscriptionRepo.save({
      tenantId,
      planId,
      status: SubscriptionStatus.TRIAL,
      startDate: now,
      trialStartDate: now,
      trialEndDate,
    });
  }

  async findByTenant(tenantId: string): Promise<Subscription[]> {
    return this.subscriptionRepo.find({
      where: { tenantId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async activate(subscriptionId: string): Promise<Subscription> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    await this.subscriptionRepo.update(subscriptionId, {
      status: SubscriptionStatus.ACTIVE,
    });

    return this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    }) as Promise<Subscription>;
  }

  async cancel(subscriptionId: string, reason?: string): Promise<void> {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    await this.subscriptionRepo.update(subscriptionId, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason ?? null,
      autoRenew: false,
    });
  }

  async checkExpired(): Promise<void> {
    const now = new Date();

    // Mark expired trials
    await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('status = :trial', { trial: SubscriptionStatus.TRIAL })
      .andWhere('"trialEndDate" < :now', { now })
      .execute();

    // Mark expired active subscriptions
    await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('status = :active', { active: SubscriptionStatus.ACTIVE })
      .andWhere('"endDate" IS NOT NULL')
      .andWhere('"endDate" < :now', { now })
      .execute();
  }
}
