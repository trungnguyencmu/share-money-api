import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = configService.get('CORS_ORIGIN')?.split(',').map((o: string) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:4200',
  ];

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Admin-Password'],
  });

  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  return { app, configService, isProduction };
}
