import * as fs from 'fs';

import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AllExceptionsFilter } from './utils/all-exceptions.filter';

async function bootstrap() {
  createUploadDirectories();

  const app = await NestFactory.create(AppModule);

  // Get the Winston logger
  const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);

  // Register the global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Define CORS options
  const corsOptions: CorsOptions = {
    origin: 'http://localhost:3000', // restrict calls to those from this origin
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS', // allow these HTTP methods
    allowedHeaders: 'Content-Type, Authorization', // allow these headers
    credentials: true,
  };

  // helmet
  app.use(helmet());

  // Enable CORS with the defined options
  app.enableCors(corsOptions);

  // Set a global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API Documentation')
    .setDescription('')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8000);
}
bootstrap();

function createUploadDirectories() {
  const directories = [
    './uploads/website',
    './uploads/avatar',
    './uploads/admin',
    './uploads/product',
    './uploads/product/related-image',
    './uploads/product/variant-image',
    './uploads/user',
    './uploads/screenshot',
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}