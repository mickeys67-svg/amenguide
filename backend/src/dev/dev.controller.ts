import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dev')
export class DevController {
  private readonly logger = new Logger(DevController.name);

  constructor(private prisma: PrismaService) {}

  @Get('reset-all')
  async resetAll() {
    this.logger.log('Development reset-all requested.');
    try {
      // Drop and recreate tables for a clean state
      // List of tables to clean up
      const tables = ['Bookmark', 'Event', 'User'];

      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(
          `DROP TABLE IF EXISTS "${table}" CASCADE;`,
        );
      }

      // Re-initialize the main tables (Event is the most critical one for now)
      await this.prisma.$executeRawUnsafe(`
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
                    "createdAt" TIMESTAMP DEFAULT (now() at time zone 'utc'),
                    "updatedAt" TIMESTAMP DEFAULT (now() at time zone 'utc')
                );
            `);

      // Also re-create User and Bookmark if needed by Prisma
      await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "User" (
                    "id" TEXT PRIMARY KEY,
                    "email" TEXT UNIQUE NOT NULL,
                    "name" TEXT,
                    "provider" TEXT NOT NULL,
                    "targetDiocese" TEXT,
                    "themeColor" TEXT,
                    "createdAt" TIMESTAMP DEFAULT (now() at time zone 'utc'),
                    "updatedAt" TIMESTAMP DEFAULT (now() at time zone 'utc')
                );
            `);

      await this.prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS "Bookmark" (
                    "id" TEXT PRIMARY KEY,
                    "userId" TEXT NOT NULL,
                    "eventId" TEXT NOT NULL,
                    "createdAt" TIMESTAMP DEFAULT (now() at time zone 'utc'),
                    UNIQUE("userId", "eventId")
                );
            `);

      return {
        success: true,
        message: 'All tables reset and re-initialized successfully.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Reset failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
