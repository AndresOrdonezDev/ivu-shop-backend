import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SHARED_DB_HOST,
  port: Number(process.env.SHARED_DB_PORT),
  username: process.env.SHARED_DB_USERNAME,
  password: process.env.SHARED_DB_PASSWORD,
  database: process.env.SHARED_DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
