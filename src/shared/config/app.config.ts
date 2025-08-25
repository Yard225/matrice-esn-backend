import { registerAs } from '@nestjs/config';

export interface AppConfig {
  name: string;
  version: string;
  description: string;
  port: number;
  environment: string;
  timezone: string;
  apiPrefix: string;
  globalPrefix: string;
}

export default registerAs('app', (): AppConfig => ({
  name: process.env.APP_NAME || 'matrice-esn-backend',
  version: process.env.APP_VERSION || '1.0.0',
  description: process.env.APP_DESCRIPTION || 'Matrice ESN Backend API',
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  timezone: process.env.TZ || 'UTC',
  apiPrefix: process.env.API_PREFIX || 'api',
  globalPrefix: process.env.GLOBAL_PREFIX || 'v1',
}));