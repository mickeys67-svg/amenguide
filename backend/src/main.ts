import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

dotenv.config();

async function bootstrap() {
  console.log('--- AMENGUIDE BACKEND VERSION: v3.1.0-SECURITY ---');

  const app = await NestFactory.create(AppModule);

  // Request body 크기 제한 (DoS 방지)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://amenguide-git-775250805671.us-west1.run.app',
    'https://amenguide-git-wcnovu4ydq-uw.a.run.app',
    'https://catholica.kr',
    'https://www.catholica.kr',
  ].filter(Boolean) as string[];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin === o)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 8080;

  // Listen FIRST — Cloud Run requires the port to open within 60s
  await app.listen(port);
  console.log(`Application is running on port ${port}`);

  // DB initialization is handled by PrismaService.onModuleInit() — no duplicate call needed.
}
bootstrap();

