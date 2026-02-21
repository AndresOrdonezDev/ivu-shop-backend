import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo negocio (onboarding público)' })
  @ApiCreatedResponse({ description: 'Negocio registrado. Se envía email de verificación al owner.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o email/slug ya en uso.' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener datos de un tenant por ID' })
  @ApiOkResponse({ description: 'Datos del tenant.' })
  @ApiNotFoundResponse({ description: 'Tenant no encontrado.' })
  @ApiForbiddenResponse({ description: 'El owner solo puede ver su propio tenant.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    if (currentUser.role === Role.OWNER && currentUser.tenantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.tenantsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar datos del propio tenant (solo owner)' })
  @ApiOkResponse({ description: 'Tenant actualizado.' })
  @ApiNotFoundResponse({ description: 'Tenant no encontrado.' })
  @ApiForbiddenResponse({ description: 'Solo el owner puede modificar su tenant.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() currentUser: User,
  ) {
    if (currentUser.tenantId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Desactivar un tenant (solo admin de plataforma)' })
  @ApiNoContentResponse({ description: 'Tenant desactivado.' })
  @ApiNotFoundResponse({ description: 'Tenant no encontrado.' })
  @ApiForbiddenResponse({ description: 'Solo el admin de plataforma puede desactivar tenants.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }
}
