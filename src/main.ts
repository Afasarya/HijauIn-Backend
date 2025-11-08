import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
