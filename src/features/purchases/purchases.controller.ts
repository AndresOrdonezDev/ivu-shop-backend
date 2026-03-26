import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseStatusDto } from './dto/update-purchase-status.dto';
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
    return this.purchasesService.create(dto, user.tenantId!);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.purchasesService.updateStatus(id, dto, user.tenantId!);
  }
}
