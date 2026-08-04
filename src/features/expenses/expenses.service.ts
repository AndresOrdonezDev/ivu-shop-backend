import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-category.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense, 'operations')
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory, 'operations')
    private readonly categoryRepo: Repository<ExpenseCategory>,
  ) {}

  // ─── Categories ───────────────────────────────────────────────────────────────

  async findAllCategories(tenantId: string): Promise<ExpenseCategory[]> {
    return this.categoryRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createCategory(
    dto: CreateExpenseCategoryDto,
    tenantId: string,
  ): Promise<ExpenseCategory> {
    const existing = await this.categoryRepo.findOne({
      where: { tenantId, name: ILike(dto.name.trim()) },
    });
    if (existing) throw new BadRequestException('A category with that name already exists');
    return this.categoryRepo.save({ name: dto.name.trim(), tenantId });
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id, tenantId } });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.delete(id);
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────────

  async findAll(tenantId: string): Promise<Expense[]> {
    return this.expenseRepo.find({
      where: { tenantId },
      relations: ['category'],
      order: { expenseDate: 'DESC' },
    });
  }

  async findById(id: string, tenantId: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id, tenantId },
      relations: ['category'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(dto: CreateExpenseDto, tenantId: string, userId: string): Promise<Expense> {
    return this.expenseRepo.save({
      tenantId,
      userId,
      description: dto.description,
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      paymentType: dto.paymentType,
      categoryId: dto.categoryId ?? null,
      notes: dto.notes ?? null,
    });
  }

  async update(id: string, dto: UpdateExpenseDto, tenantId: string): Promise<Expense> {
    await this.findById(id, tenantId);
    const updateData: Partial<Expense> = { ...dto } as any;
    if (dto.expenseDate) {
      updateData.expenseDate = new Date(dto.expenseDate);
    }
    await this.expenseRepo.update(id, updateData);
    return this.findById(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.expenseRepo.delete(id);
  }
}
