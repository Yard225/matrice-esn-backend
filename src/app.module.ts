import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import appConfig from './shared/config/app.config';
import databaseConfig from './shared/config/database.config';
import jwtConfig from './shared/config/jwt.config';
import { validate } from './shared/config/env.validation';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

// Feature Modules
import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validate,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),

    // Database
    // TODO: Add TypeORM module
    
    // Features
    AuthModule,
    
    // TODO: Add other feature modules:
    // UsersModule,
    // RolesModule,
    // InteractionsModule,
    // ReportsModule,
    // BrandingModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}