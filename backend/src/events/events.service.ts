import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { convert } from 'html-to-text';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

import { BaseScraperService } from '../scrapers/base-scraper.service';
import { AiRefinerService } from '../scrapers/ai-refiner.service';
import { SacredWhisperService } from '../scrapers/sacred-whisper.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private baseScraper: BaseScraperService,
    private aiRefiner: AiRefinerService,
    private sacredWhisper: SacredWhisperService,
  ) { }

  async triggerAsyncScrape(url: string) {
    this.logger.log(`Received async scrape request for URL: ${url}`);
    this.sacredWhisper.process(url); // Don't await
    return { message: 'Sacred Whisper initiated in background.', url };
  }

  async scrapeAndSave(url: string) {
    try {
      // Duplicate Check
      const existing = await this.prisma.event.findFirst({
        where: { originUrl: url },
      });
      if (existing) return existing;

      const result = await this.scrapeOnDemand(url);

      return this.prisma.event.create({
        data: {
          title: result.title,
          date: new Date(result.date),
          location: result.location,
          aiSummary: result.aiSummary,
          themeColor: result.themeColor,
          originUrl: url,
          category: '기타', // Default category
        },
      });
    } catch (error) {
      this.logger.error(`Failed to scrape and save ${url}: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error.message.includes('does not exist')) {
        this.logger.warn(
          'Table "event" not found, attempting on-the-fly creation.',
        );
        await this.nuclearReset();
        // Retry once
        return await this.prisma.event.findMany({
          orderBy: { createdAt: 'desc' },
        });
      }
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
    });
  }

  async scrapeOnDemand(url: string) {
    try {
      this.logger.log(`On-demand scraping initiated for: ${url}`);

      // 1. Fetch HTML
      const html = await this.baseScraper.fetchHtml(url);

      // 2. Extract Text
      const text = await this.baseScraper.extractText(html);

      // 3. AI Refinement
      const result = await this.aiRefiner.refine(text);

      return {
        ...result,
        originUrl: url,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}: ${error.message}`);
      throw error;
    }
  }
  async nuclearReset() {
    try {
      await this.prisma.$executeRawUnsafe(
        'DROP TABLE IF EXISTS "event" CASCADE;',
      );
      await this.prisma.$executeRawUnsafe(
        'DROP TABLE IF EXISTS "Event" CASCADE;',
      );
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

      return {
        message:
          "Database reset and 'Event' table created clean (aligned with Prisma).",
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async debugTables() {
    try {
      return await this.prisma
        .$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    } catch (error) {
      return { error: error.message };
    }
  }

  async getDiagnostics() {
    try {
      const count = await this.prisma.event.count();
      const dbUrl = process.env.DATABASE_URL || 'not-set';
      // Masking password for safety
      const maskedDbUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');

      return {
        status: 'ok',
        database: maskedDbUrl,
        eventCount: count,
        region: process.env.REGION || 'us-west1',
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
