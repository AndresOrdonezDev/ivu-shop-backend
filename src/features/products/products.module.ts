import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductLine } from './entities/product-line.entity';
import { ProductBarcode } from './entities/product-barcode.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductLine, ProductBarcode], 'operations'),
    InventoryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
