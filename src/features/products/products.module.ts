import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductLine } from './entities/product-line.entity';
import { ProductBarcode } from './entities/product-barcode.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { PurchaseInvoiceItem } from '../purchases/entities/purchase-invoice-item.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        Product,
        ProductLine,
        ProductBarcode,
        SaleItem,
        PurchaseInvoiceItem,
        InventoryMovement,
      ],
      'operations',
    ),
    InventoryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
