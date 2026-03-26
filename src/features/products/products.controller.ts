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
import { CreateCategoryDto } from './dto/create-category.dto';
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

  // ─── Categories ───────────────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories(@CurrentUser() user: User) {
    return this.productsService.findAllCategories(user.tenantId!);
  }

  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  createCategory(@Body() dto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.productsService.createCategory(dto, user.tenantId!);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  deleteCategory(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.deleteCategory(id, user.tenantId!);
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
