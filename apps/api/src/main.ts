import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { config } from './config';
import { logger } from './logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.enableCors({
    origin: config.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400,
  });

  // Global prefix (exclude swagger docs)
  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'api/docs-json'],
  });

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('EG Antiq API')
    .setDescription('Ancient Egyptian Monuments and Heritage Management System API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Monuments', 'Ancient monuments and sites management')
    .addTag('Gallery', 'Monument gallery images management')
    .addTag('Descriptions', 'Monument descriptions management')
    .addTag('Eras', 'Historical eras management')
    .addTag('Dynasties', 'Egyptian dynasties management')
    .addTag('Monument Types', 'Types of monuments (temple, tomb, etc.)')
    .addTag('Monuments Era', 'Monument era relationships')
    .addTag('Roles', 'User roles and permissions management')
    .addTag('Health', 'API health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = config.PORT;
  await app.listen(port);

  logger.info(`Application started successfully`, {
    port,
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
  });

  // Handle shutdown signals
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      try {
        await app.close();
        logger.info('Application shut down successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start application', { error });
  process.exit(1);
});
