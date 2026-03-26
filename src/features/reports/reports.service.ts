import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { PurchaseInvoice } from '../purchases/entities/purchase-invoice.entity';
import { SaleStatus } from '../sales/enums/sale-status.enum';
import { PurchaseStatus } from '../purchases/enums/purchase-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale, 'operations')
    private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem, 'operations')
    private readonly saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Expense, 'operations')
    private readonly expenseRepo: Repository<Expense>,
    @InjectRepository(Product, 'operations')
    private readonly productRepo: Repository<Product>,
    @InjectRepository(PurchaseInvoice, 'operations')
    private readonly purchaseRepo: Repository<PurchaseInvoice>,
  ) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────────

  async getDashboard(tenantId: string, from: string, to: string) {
    const [salesRow, cogsRow, expensesRow, lowStockCount, pendingPurchasesRow] =
      await Promise.all([
        // Resumen de ventas
        this.saleRepo
          .createQueryBuilder('s')
          .select('COUNT(s.id)', 'totalSales')
          .addSelect('COALESCE(SUM(CAST(s.total AS numeric)), 0)', 'revenue')
          .addSelect('COALESCE(SUM(CAST(s.taxAmount AS numeric)), 0)', 'taxCollected')
          .addSelect('COALESCE(SUM(CAST(s.discount AS numeric)), 0)', 'totalDiscounts')
          .where('s.tenantId = :tenantId', { tenantId })
          .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
          .andWhere('s.saleDate BETWEEN :from AND :to', { from, to })
          .getRawOne(),

        // Costo de ventas (COGS)
        this.saleItemRepo
          .createQueryBuilder('si')
          .innerJoin('si.sale', 's')
          .select(
            'COALESCE(SUM(si.quantity * CAST(si.costAtSale AS numeric)), 0)',
            'cogs',
          )
          .where('s.tenantId = :tenantId', { tenantId })
          .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
          .andWhere('s.saleDate BETWEEN :from AND :to', { from, to })
          .getRawOne(),

        // Gastos del período
        this.expenseRepo
          .createQueryBuilder('e')
          .select('COALESCE(SUM(CAST(e.amount AS numeric)), 0)', 'totalExpenses')
          .where('e.tenantId = :tenantId', { tenantId })
          .andWhere('e.expenseDate BETWEEN :from AND :to', { from, to })
          .getRawOne(),

        // Productos con bajo stock
        this.productRepo
          .createQueryBuilder('p')
          .where('p.tenantId = :tenantId', { tenantId })
          .andWhere('p.isActive = true')
          .andWhere('p.stock <= p.minStock')
          .getCount(),

        // Facturas de compra pendientes
        this.purchaseRepo
          .createQueryBuilder('pi')
          .select('COALESCE(SUM(CAST(pi.total AS numeric)), 0)', 'pendingAmount')
          .where('pi.tenantId = :tenantId', { tenantId })
          .andWhere('pi.status IN (:...statuses)', {
            statuses: [PurchaseStatus.PENDING, PurchaseStatus.PARTIAL],
          })
          .getRawOne(),
      ]);

    const revenue = Number(salesRow.revenue);
    const cogs = Number(cogsRow.cogs);
    const expenses = Number(expensesRow.totalExpenses);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return {
      period: { from, to },
      sales: {
        count: Number(salesRow.totalSales),
        revenue,
        taxCollected: Number(salesRow.taxCollected),
        totalDiscounts: Number(salesRow.totalDiscounts),
      },
      profitability: {
        cogs,
        grossProfit,
        grossMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0,
        expenses,
        netProfit,
        netMargin: revenue > 0 ? Math.round((netProfit / revenue) * 10000) / 100 : 0,
      },
      inventory: {
        lowStockCount,
      },
      purchases: {
        pendingAmount: Number(pendingPurchasesRow.pendingAmount),
      },
    };
  }

  // ─── Profit & Loss ────────────────────────────────────────────────────────────

  async getProfitAndLoss(tenantId: string, from: string, to: string) {
    const [salesRows, expensesRows, cogsRow] = await Promise.all([
      // Ventas agrupadas por día
      this.saleRepo
        .createQueryBuilder('s')
        .select("DATE_TRUNC('day', s.saleDate)", 'date')
        .addSelect('COUNT(s.id)', 'salesCount')
        .addSelect('COALESCE(SUM(CAST(s.total AS numeric)), 0)', 'revenue')
        .where('s.tenantId = :tenantId', { tenantId })
        .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere('s.saleDate BETWEEN :from AND :to', { from, to })
        .groupBy("DATE_TRUNC('day', s.saleDate)")
        .orderBy("DATE_TRUNC('day', s.saleDate)", 'ASC')
        .getRawMany(),

      // Gastos agrupados por categoría
      this.expenseRepo
        .createQueryBuilder('e')
        .select('e.categoryId', 'categoryId')
        .addSelect('COALESCE(SUM(CAST(e.amount AS numeric)), 0)', 'total')
        .where('e.tenantId = :tenantId', { tenantId })
        .andWhere('e.expenseDate BETWEEN :from AND :to', { from, to })
        .groupBy('e.categoryId')
        .getRawMany(),

      // COGS total
      this.saleItemRepo
        .createQueryBuilder('si')
        .innerJoin('si.sale', 's')
        .select(
          'COALESCE(SUM(si.quantity * CAST(si.costAtSale AS numeric)), 0)',
          'cogs',
        )
        .where('s.tenantId = :tenantId', { tenantId })
        .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere('s.saleDate BETWEEN :from AND :to', { from, to })
        .getRawOne(),
    ]);

    const revenue = salesRows.reduce((sum, r) => sum + Number(r.revenue), 0);
    const cogs = Number(cogsRow.cogs);
    const totalExpenses = expensesRows.reduce((sum, r) => sum + Number(r.total), 0);

    return {
      period: { from, to },
      revenue,
      cogs,
      grossProfit: revenue - cogs,
      grossMargin: revenue > 0 ? Math.round(((revenue - cogs) / revenue) * 10000) / 100 : 0,
      expenses: totalExpenses,
      netProfit: revenue - cogs - totalExpenses,
      netMargin:
        revenue > 0
          ? Math.round(((revenue - cogs - totalExpenses) / revenue) * 10000) / 100
          : 0,
      dailySales: salesRows.map((r) => ({
        date: r.date,
        salesCount: Number(r.salesCount),
        revenue: Number(r.revenue),
      })),
      expensesByCategory: expensesRows.map((r) => ({
        categoryId: r.categoryId,
        total: Number(r.total),
      })),
    };
  }

  // ─── Top products ─────────────────────────────────────────────────────────────

  async getTopProducts(
    tenantId: string,
    from: string,
    to: string,
    limit = 10,
  ) {
    const rows = await this.saleItemRepo
      .createQueryBuilder('si')
      .innerJoin('si.sale', 's')
      .innerJoin(Product, 'p', 'p.id = si.productId')
      .select('si.productId', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('SUM(si.quantity)', 'unitsSold')
      .addSelect('COALESCE(SUM(CAST(si.subtotal AS numeric)), 0)', 'revenue')
      .addSelect(
        'COALESCE(SUM(si.quantity * CAST(si.costAtSale AS numeric)), 0)',
        'cogs',
      )
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('s.saleDate BETWEEN :from AND :to', { from, to })
      .groupBy('si.productId')
      .addGroupBy('p.name')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r) => ({
      productId: r.productId,
      name: r.name,
      unitsSold: Number(r.unitsSold),
      revenue: Number(r.revenue),
      cogs: Number(r.cogs),
      profit: Number(r.revenue) - Number(r.cogs),
    }));
  }

  // ─── Inventory valuation ──────────────────────────────────────────────────────

  async getInventoryValuation(tenantId: string) {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p.stock', 'stock')
      .addSelect('CAST(p.cost AS numeric)', 'cost')
      .addSelect('CAST(p.price AS numeric)', 'price')
      .addSelect('p.minStock', 'minStock')
      .addSelect('(p.stock * CAST(p.cost AS numeric))', 'costValue')
      .addSelect('(p.stock * CAST(p.price AS numeric))', 'retailValue')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.isActive = true')
      .orderBy('costValue', 'DESC')
      .getRawMany();

    const totalCostValue = products.reduce((sum, p) => sum + Number(p.costValue), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + Number(p.retailValue), 0);
    const lowStock = products.filter((p) => Number(p.stock) <= Number(p.minStock));

    return {
      summary: {
        totalProducts: products.length,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
        lowStockCount: lowStock.length,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        stock: Number(p.stock),
        cost: Number(p.cost),
        price: Number(p.price),
        minStock: Number(p.minStock),
        costValue: Math.round(Number(p.costValue) * 100) / 100,
        retailValue: Math.round(Number(p.retailValue) * 100) / 100,
        isLowStock: Number(p.stock) <= Number(p.minStock),
      })),
    };
  }
}
