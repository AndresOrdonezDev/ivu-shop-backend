import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './core/users/users.module';
import { AuthModule } from './core/auth/auth.module';
import { MailModule } from './core/mail/mail.module';
import { PlansModule } from './core/plans/plans.module';
import { SubscriptionsModule } from './core/subscriptions/subscriptions.module';
import { TenantsModule } from './core/tenants/tenants.module';
import { TenantConnectionInterceptor } from './common/interceptors/tenant-connection.interceptor';
import { ProductsModule } from './features/products/products.module';
import { InventoryModule } from './features/inventory/inventory.module';
import { SuppliersModule } from './features/suppliers/suppliers.module';
import { PurchasesModule } from './features/purchases/purchases.module';
import { CustomersModule } from './features/customers/customers.module';
import { SalesModule } from './features/sales/sales.module';
import { ExpensesModule } from './features/expenses/expenses.module';
import { ReportsModule } from './features/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // shared_db — usuarios, tenants, planes, suscripciones
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('SHARED_DB_HOST'),
        port: config.get<number>('SHARED_DB_PORT'),
        username: config.get<string>('SHARED_DB_USERNAME'),
        password: config.get<string>('SHARED_DB_PASSWORD'),
        database: config.get<string>('SHARED_DB_NAME'),
        entities: [__dirname + '/core/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: false,
      }),
    }),

    // operations_db — datos operativos por vertical de negocio
    TypeOrmModule.forRootAsync({
      name: 'operations',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('OPERATIONS_DB_HOST'),
        port: config.get<number>('OPERATIONS_DB_PORT'),
        username: config.get<string>('OPERATIONS_DB_USERNAME'),
        password: config.get<string>('OPERATIONS_DB_PASSWORD'),
        database: config.get<string>('OPERATIONS_DB_NAME'),
        entities: [__dirname + '/features/**/*.entity{.ts,.js}'],
        synchronize: false,
        migrationsRun: false,
      }),
    }),

    UsersModule,
    AuthModule,
    MailModule,
    PlansModule,
    SubscriptionsModule,
    TenantsModule,
    ProductsModule,
    InventoryModule,
    SuppliersModule,
    PurchasesModule,
    CustomersModule,
    SalesModule,
    ExpensesModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantConnectionInterceptor },
  ],
})
export class AppModule {}
