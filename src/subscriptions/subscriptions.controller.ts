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
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Obtener las suscripciones del tenant autenticado' })
  @ApiOkResponse({ description: 'Lista de suscripciones del tenant, con datos del plan.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  getMySubscriptions(@CurrentUser() user: User) {
    return this.subscriptionsService.findByTenant(user.tenantId!);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Cancelar una suscripción (solo owner del tenant)' })
  @ApiOkResponse({ description: 'Suscripción cancelada.' })
  @ApiNotFoundResponse({ description: 'Suscripción no encontrada.' })
  @ApiForbiddenResponse({ description: 'Solo el owner puede cancelar suscripciones.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  cancel(@Param('id') id: string, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancel(id, dto.reason);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar una suscripción (solo admin de plataforma)' })
  @ApiOkResponse({ description: 'Suscripción activada.' })
  @ApiNotFoundResponse({ description: 'Suscripción no encontrada.' })
  @ApiForbiddenResponse({ description: 'Solo el admin de plataforma puede activar suscripciones.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  activate(@Param('id') id: string) {
    return this.subscriptionsService.activate(id);
  }
}
