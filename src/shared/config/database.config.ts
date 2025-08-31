import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
  synchronize: boolean;
  migrationsRun: boolean;
  entities: string[];
  migrations: string[];
  seeds: string[];
  factories: string[];
  maxConnections: number;
  connectTimeoutMS: number;
  acquireTimeoutMS: number;
  timeout: number;
}

export default registerAs('database', (): TypeOrmModuleOptions & DatabaseConfig => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'matrice_esn',
  ssl: process.env.DB_SSL === 'true',
  logging: process.env.DB_LOGGING === 'true',
  synchronize: process.env.NODE_ENV === 'development',
  migrationsRun: process.env.NODE_ENV !== 'development',
  entities: ['dist/**/*.schema.js'],
  migrations: ['dist/shared/database/migrations/*.js'],
  seeds: ['dist/shared/database/seeds/*.js'],
  factories: ['dist/shared/database/factories/*.js'],
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '60000', 10),
  acquireTimeoutMS: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
  timeout: parseInt(process.env.DB_TIMEOUT || '60000', 10),
}));