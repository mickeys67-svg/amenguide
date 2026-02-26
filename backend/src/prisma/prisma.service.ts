import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    // PrismaPg adapter uses a pg.Pool — connection is established lazily on first query.
    // Do NOT await $connect() here: it blocks NestJS bootstrap → Cloud Run port never opens
    // within the 60s deadline → deploy fails with "container failed to start".
    this.$connect().catch((err) => {
      console.error('PrismaService: initial DB connect failed (will retry on first query):', err.message);
    });
    console.log('PrismaService initialized (lazy pool via PrismaPg).');
  }

  /**
   * DEFINITIVE: Unified system database initialization.
   * Ensures tables match Prisma schema casing and constraints.
   */
  async initDatabase() {
    console.log('--- DEFINITIVE DATABASE INITIALIZATION START ---');
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
    await this.$executeRawUnsafe(sql);

    // Add new columns for existing tables (idempotent ALTER TABLE)
    const alterSql = `
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'APPROVED';
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "submitterName" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "submitterContact" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
    `;
    await this.$executeRawUnsafe(alterSql);
    console.log('--- DEFINITIVE DATABASE INITIALIZATION COMPLETE ---');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
