import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { TenantConnectionInterceptor } from './common/interceptors/tenant-connection.interceptor';

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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
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
        entities: [],
        synchronize: false,
        migrationsRun: false,
      }),
    }),

    UsersModule,
    AuthModule,
    MailModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TenantConnectionInterceptor },
  ],
})
export class AppModule {}
