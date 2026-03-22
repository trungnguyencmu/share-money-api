import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Enable DI in class-validator
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);

  // CORS configuration
  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = configService.get('CORS_ORIGIN')?.split(',').map((o: string) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4200',
  ];

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Security headers (register early)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    })
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Swagger configuration -- disabled in production
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Share Money API')
      .setDescription('Share Money API Documentation')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
        description: 'Enter JWT token',
      })
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
      },
    });
  }

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  if (!isProduction) {
    logger.log(`API Documentation available at: http://localhost:${port}/docs`);
  }
}

bootstrap();
