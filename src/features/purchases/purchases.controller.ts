import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../core/users/entities/user.entity';

@Controller('purchases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.purchasesService.findAll(user.tenantId!);
  }

  @Get('pending')
  findPending(@CurrentUser() user: User) {
    return this.purchasesService.findPending(user.tenantId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchasesService.findById(id, user.tenantId!);
  }

  @Post()
  create(@Body() dto: CreatePurchaseDto, @CurrentUser() user: User) {
    return this.purchasesService.create(dto, user.tenantId!, user.id);
  }

  @Get(':id/payments')
  findPayments(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchasesService.findPayments(id, user.tenantId!);
  }

  @Post(':id/payments')
  registerPayment(
    @Param('id') id: string,
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.purchasesService.registerPayment(
      id,
      dto,
      user.tenantId!,
      user.id,
    );
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.purchasesService.cancel(id, user.tenantId!);
  }
}
