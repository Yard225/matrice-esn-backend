import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max, validateSync, IsBoolean } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  APP_NAME: string = 'matrice-esn-backend';

  @IsString()
  APP_VERSION: string = '1.0.0';

  // Database
  @IsString()
  DB_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  DB_SSL: boolean = false;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION: string = '15m';

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d';

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  // Email
  @IsString()
  @IsOptional()
  SMTP_HOST: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  SMTP_PORT: number = 587;

  @IsString()
  @IsOptional()
  SMTP_USER: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM: string;

  // Security
  @IsString()
  @IsOptional()
  CORS_ORIGINS: string = 'http://localhost:3000';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_TTL: number = 60;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  RATE_LIMIT_LIMIT: number = 100;

  // Monitoring
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  SENTRY_DSN: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  
  return validatedConfig;
}