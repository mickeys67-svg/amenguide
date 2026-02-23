import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  console.log('--- AMENGUIDE BACKEND VERSION: v3.0.0-FINAL ---');

  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'https://amenguide-git-775250805671.us-west1.run.app',
  ].filter(Boolean) as string[];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 8080;

  // Listen FIRST — Cloud Run requires the port to open within 60s
  await app.listen(port);
  console.log(`Application is running on port ${port}`);

  // DB initialization runs AFTER port is open (non-blocking for startup)
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.initDatabase();
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('DB init failed (non-fatal):', err.message);
  }
}
bootstrap();

