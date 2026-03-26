import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../core/users/entities/user.entity';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ─── Categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories(@CurrentUser() user: User) {
    return this.expensesService.findAllCategories(user.tenantId!);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  createCategory(@Body() dto: CreateExpenseCategoryDto, @CurrentUser() user: User) {
    return this.expensesService.createCategory(dto, user.tenantId!);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  deleteCategory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.deleteCategory(id, user.tenantId!);
  }

  // ─── Expenses ───────────────────────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.expensesService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.findById(id, user.tenantId!);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN, Role.EMPLOYEE)
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: User) {
    return this.expensesService.create(dto, user.tenantId!, user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto, @CurrentUser() user: User) {
    return this.expensesService.update(id, dto, user.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.expensesService.remove(id, user.tenantId!);
  }
}
