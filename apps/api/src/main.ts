import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { createApp } from './app-factory';

async function bootstrap() {
  const { app, configService, isProduction } = await createApp();
  const logger = new Logger('Bootstrap');

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

  app.enableShutdownHooks();

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}`);
  if (!isProduction) {
    logger.log(`API Documentation available at: http://localhost:${port}/docs`);
  }
}

bootstrap();
