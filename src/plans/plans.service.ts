import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  async findAll(): Promise<Plan[]> {
    return this.planRepo.find({
      where: { isActive: true, isPublic: true },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan ${id} not found`);
    return plan;
  }

  async findCheapestActive(): Promise<Plan | null> {
    return this.planRepo.findOne({
      where: { isActive: true, isPublic: true },
      order: { sortOrder: 'ASC', price: 'ASC' },
    });
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    return this.planRepo.save(dto);
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    await this.findById(id);
    await this.planRepo.update(id, dto);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);
    await this.planRepo.update(id, { isActive: false });
  }
}
