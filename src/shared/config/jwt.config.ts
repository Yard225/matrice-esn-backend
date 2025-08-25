import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  algorithm: string;
}

export default registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET || 'default-secret-key',
  expiresIn: process.env.JWT_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  issuer: process.env.JWT_ISSUER || 'matrice-esn-backend',
  audience: process.env.JWT_AUDIENCE || 'matrice-esn-frontend',
  algorithm: 'HS256',
}));