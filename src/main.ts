import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration
  const port = configService.get<number>('app.port', 3000);
  const environment = configService.get<string>('app.environment', 'development');
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const globalPrefix = configService.get<string>('app.globalPrefix', 'v1');

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: environment === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix(`${apiPrefix}/${globalPrefix}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: environment === 'production',
    }),
  );

  // Swagger documentation
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Matrice ESN Backend API')
      .setDescription('API for ESN Matrix Backend Application')
      .setVersion(configService.get<string>('app.version', '1.0.0'))
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Roles', 'Role management endpoints')
      .addTag('Interactions', 'Interaction matrix endpoints')
      .addTag('Reports', 'Reporting and analytics endpoints')
      .addTag('Branding', 'Application branding endpoints')
      .addTag('Health', 'System health check endpoints')
      .addServer(`http://localhost:${port}`, 'Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
    });

    console.log(`📚 Swagger documentation available at: http://localhost:${port}/${apiPrefix}/docs`);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🔄 Received SIGINT, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🔄 Received SIGTERM, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Start the application
  await app.listen(port, '0.0.0.0');

  console.log('🚀 Application started successfully!');
  console.log(`🌍 Server running on: http://localhost:${port}`);
  console.log(`📡 API endpoint: http://localhost:${port}/${apiPrefix}/${globalPrefix}`);
  console.log(`🏗️  Environment: ${environment}`);
  console.log(`📊 Health check: http://localhost:${port}/${apiPrefix}/${globalPrefix}/health`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});