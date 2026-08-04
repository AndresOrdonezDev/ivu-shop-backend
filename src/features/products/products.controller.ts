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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateLineDto } from './dto/create-line.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '../../core/users/entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Lines ────────────────────────────────────────────────────────────────────

  @Get('lines')
  findAllLines(@CurrentUser() user: User) {
    return this.productsService.findAllLines(user.tenantId!);
  }

  @Post('lines')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  createLine(@Body() dto: CreateLineDto, @CurrentUser() user: User) {
    return this.productsService.createLine(dto, user.tenantId!);
  }

  @Delete('lines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  deleteLine(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.deleteLine(id, user.tenantId!);
  }

  // ─── Barcode lookup — POS ─────────────────────────────────────────────────────

  @Get('barcode/:code')
  findByBarcode(@Param('code') code: string, @CurrentUser() user: User) {
    return this.productsService.findByBarcode(code, user.tenantId!);
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.productsService.findAll(user.tenantId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.findById(id, user.tenantId!);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  create(@Body() dto: CreateProductDto, @CurrentUser() user: User) {
    return this.productsService.create(dto, user.tenantId!);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.update(id, dto, user.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.deactivate(id, user.tenantId!);
  }
}
