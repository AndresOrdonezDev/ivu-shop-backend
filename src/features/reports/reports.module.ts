import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { PurchaseInvoice } from '../purchases/entities/purchase-invoice.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Sale, SaleItem, Expense, Product, PurchaseInvoice],
      'operations',
    ),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
