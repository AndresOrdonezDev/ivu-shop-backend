import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceItem } from './entities/purchase-invoice-item.entity';
import { Egreso } from './entities/egreso.entity';
import { Product } from '../products/entities/product.entity';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ThirdpartiesModule } from '../thirdparties/thirdparties.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [PurchaseInvoice, PurchaseInvoiceItem, Egreso, Product],
      'operations',
    ),
    InventoryModule,
    ThirdpartiesModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
