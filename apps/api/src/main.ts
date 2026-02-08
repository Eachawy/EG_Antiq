import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { config } from './config';
import { logger } from './logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Serve static files (uploaded images)
  // In production (Docker): __dirname = /app/dist, so we need /app/uploads
  // In development: adjust path accordingly
  const uploadsPath = process.env.NODE_ENV === 'production'
    ? '/app/uploads'
    : join(__dirname, '..', '..', 'uploads');

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Security middleware - Configure helmet to allow SVG files
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    })
  );

  // CORS configuration
  // Explicitly whitelisted origins for security (no wildcard allowed with credentials)
  app.enableCors({
    origin: [
      'https://kemetra.org',
      'https://www.kemetra.org',
      'https://admin.kemetra.org',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:9000',
      'http://localhost:9001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'X-Request-ID'],
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
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
    .addTag('Authentication', 'Admin authentication and authorization endpoints')
    .addTag('Monuments', 'Ancient monuments and sites management (Admin)')
    .addTag('Gallery', 'Monument gallery images management')
    .addTag('Descriptions', 'Monument descriptions management')
    .addTag('Eras', 'Historical eras management')
    .addTag('Dynasties', 'Egyptian dynasties management')
    .addTag('Monument Types', 'Types of monuments (temple, tomb, etc.)')
    .addTag('Monuments Era', 'Monument era relationships')
    .addTag('Roles', 'User roles and permissions management')
    .addTag('Health', 'API health check endpoints')
    .addTag('Portal Auth', 'Portal user authentication (email/password + OAuth)')
    .addTag('Portal Users', 'Portal user profile management')
    .addTag('Portal Monuments', 'Public monument search and browsing')
    .addTag('Favorites', 'User favorites management')
    .addTag('Browsing History', 'User browsing history tracking')
    .addTag('Saved Searches', 'User saved searches management')
    .addTag('Portal Settings', 'User settings and preferences')
    .addTag('Contact', 'Contact form submissions')
    .addTag('Newsletter', 'Newsletter subscription management')
    .addTag('Upload', 'File upload endpoints')
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
    version: '1.0.0',
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
