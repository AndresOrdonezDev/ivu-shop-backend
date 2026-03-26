import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const OperationsDataSource = new DataSource({
  type: 'postgres',
  host: process.env.OPERATIONS_DB_HOST,
  port: Number(process.env.OPERATIONS_DB_PORT),
  username: process.env.OPERATIONS_DB_USERNAME,
  password: process.env.OPERATIONS_DB_PASSWORD,
  database: process.env.OPERATIONS_DB_NAME,
  entities: ['src/features/**/*.entity.ts'],
  migrations: ['src/database/migrations/operations/*.ts'],
  synchronize: false,
});
