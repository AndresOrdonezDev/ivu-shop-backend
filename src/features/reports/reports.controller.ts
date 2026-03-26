import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../core/users/entities/user.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Query() query: DateRangeDto, @CurrentUser() user: User) {
    return this.reportsService.getDashboard(user.tenantId!, query.from, query.to);
  }

  @Get('profit-loss')
  getProfitAndLoss(@Query() query: DateRangeDto, @CurrentUser() user: User) {
    return this.reportsService.getProfitAndLoss(user.tenantId!, query.from, query.to);
  }

  @Get('top-products')
  getTopProducts(@Query() query: DateRangeDto, @CurrentUser() user: User) {
    const limit = 10;
    return this.reportsService.getTopProducts(user.tenantId!, query.from, query.to, limit);
  }

  @Get('inventory')
  getInventoryValuation(@CurrentUser() user: User) {
    return this.reportsService.getInventoryValuation(user.tenantId!);
  }
}
