import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios del tenant autenticado' })
  @ApiOkResponse({ description: 'Lista de usuarios activos del tenant.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  findAll(@CurrentUser() currentUser: User) {
    return this.usersService.findByTenant(currentUser.tenantId!);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID (mismo tenant)' })
  @ApiOkResponse({ description: 'Usuario encontrado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @ApiForbiddenResponse({ description: 'El usuario no pertenece al tenant.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return user;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario dentro del tenant (owner o admin)' })
  @ApiCreatedResponse({ description: 'Usuario creado dentro del tenant.' })
  @ApiBadRequestResponse({ description: 'Email ya en uso.' })
  @ApiForbiddenResponse({ description: 'Rol insuficiente.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: User) {
    return this.usersService.create(dto, currentUser.tenantId!);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de un usuario del tenant' })
  @ApiOkResponse({ description: 'Usuario actualizado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @ApiForbiddenResponse({ description: 'Sin acceso o rol insuficiente.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Access denied');
    }
    await this.usersService.update(id, dto);
    return this.usersService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Desactivar un usuario del tenant (soft delete)' })
  @ApiNoContentResponse({ description: 'Usuario desactivado.' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado.' })
  @ApiForbiddenResponse({ description: 'Sin acceso o rol insuficiente.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  async deactivate(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.deactivate(id);
  }
}
