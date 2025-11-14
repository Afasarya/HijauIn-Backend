import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ensure uploads directories exist
  const uploadFolders = ['articles', 'products', 'product-categories', 'waste-locations'];
  const uploadsPath = join(__dirname, '..', 'uploads');
  
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  
  uploadFolders.forEach(folder => {
    const folderPath = join(uploadsPath, folder);
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
  });
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  
  // Enable CORS untuk frontend dan Midtrans webhook
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://mentorit.my.id',
      'https://www.mentorit.my.id',
      'https://app.midtrans.com',
      'https://app.sandbox.midtrans.com',
      'https://api.midtrans.com',
      'https://api.sandbox.midtrans.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  // Increase payload size limit for image uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📡 Webhook URL: ${process.env.BACKEND_URL}/transactions/webhook/midtrans`);
}
bootstrap();
