import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiTags('plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planes públicos activos (página de precios)' })
  @ApiOkResponse({ description: 'Lista de planes disponibles, ordenados por sortOrder.' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un plan por ID' })
  @ApiOkResponse({ description: 'Datos del plan.' })
  @ApiNotFoundResponse({ description: 'Plan no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear un nuevo plan (solo admin de plataforma)' })
  @ApiCreatedResponse({ description: 'Plan creado.' })
  @ApiForbiddenResponse({ description: 'Solo el admin de plataforma puede crear planes.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar un plan existente (solo admin de plataforma)' })
  @ApiOkResponse({ description: 'Plan actualizado.' })
  @ApiNotFoundResponse({ description: 'Plan no encontrado.' })
  @ApiForbiddenResponse({ description: 'Solo el admin de plataforma puede editar planes.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Desactivar un plan (solo admin de plataforma)' })
  @ApiNoContentResponse({ description: 'Plan desactivado.' })
  @ApiNotFoundResponse({ description: 'Plan no encontrado.' })
  @ApiForbiddenResponse({ description: 'Solo el admin de plataforma puede desactivar planes.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }
}
