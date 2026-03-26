import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../core/users/entities/user.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('low-stock')
  findLowStock(@CurrentUser() user: User) {
    return this.inventoryService.findLowStock(user.tenantId!);
  }

  @Get(':productId/movements')
  findByProduct(@Param('productId') productId: string, @CurrentUser() user: User) {
    return this.inventoryService.findByProduct(productId, user.tenantId!);
  }

  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  adjust(@Body() dto: AdjustInventoryDto, @CurrentUser() user: User) {
    return this.inventoryService.adjust(dto, user.tenantId!);
  }
}
