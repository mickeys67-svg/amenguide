import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {

  console.log('--- AMENGUIDE BACKEND VERSION: v1.2.1-efbebaf-FORCE ---');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors(); // CORS 허용 (프론트엔드 연동)

  // Failsafe Database Initialization using the actual app service
  const prismaService = app.get(PrismaService);
  try {
    console.log(
      'Ensuring database schema exists (Unified definitive Event table creation aligned with Prisma PascalCase)...',
    );
    const sql = `
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT,
        "provider" TEXT NOT NULL,
        "targetDiocese" TEXT,
        "themeColor" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "date" TIMESTAMP,
        "location" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "originUrl" TEXT,
        "aiSummary" TEXT,
        "themeColor" TEXT,
        "category" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Bookmark" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "eventId")
      );
    `;
    await prismaService.$executeRawUnsafe(sql);
    console.log('Database schema verified (Definitive: User, Event, Bookmark).');
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
  }


  const port = process.env.PORT ?? 8080;
  console.log(`Application is starting on port ${port}`);
  await app.listen(port);
}
bootstrap();
