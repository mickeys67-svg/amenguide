import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors(); // CORS 허용 (프론트엔드 연동)

  // Failsafe Database Initialization using the actual app service
  const prismaService = app.get(PrismaService);
  try {
    console.log('Ensuring database schema exists (Unified definitive Event table creation aligned with Prisma PascalCase)...');
    const sql = `
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
    `;
    await prismaService.$executeRawUnsafe(sql);
    console.log('Database schema verified (Definitive).');
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
  }

  const port = process.env.PORT ?? 8080;
  console.log(`Application is starting on port ${port}`);
  await app.listen(port);
}
bootstrap();
