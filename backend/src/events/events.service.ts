import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BaseScraperService } from '../scrapers/base-scraper.service';
import { AiRefinerService } from '../scrapers/ai-refiner.service';
import { SacredWhisperService } from '../scrapers/sacred-whisper.service';
import { DioceseSyncService } from '../scrapers/diocese-sync.service';


@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private baseScraper: BaseScraperService,
    private aiRefiner: AiRefinerService,
    private sacredWhisper: SacredWhisperService,
    private dioceseSync: DioceseSyncService,
  ) { }

  async triggerAsyncScrape(url: string) {
    this.logger.log(`Received async scrape request for URL: ${url}`);
    this.sacredWhisper.process(url); // Don't await
    return { message: 'Sacred Whisper initiated in background.', url };
  }

  async triggerDioceseSync(monthsAhead = 3) {
    this.logger.log(`Diocese sync triggered (monthsAhead=${monthsAhead})`);
    // Run in background — return immediately
    this.dioceseSync.runAll(monthsAhead).then((result) => {
      this.logger.log(`Diocese sync finished: ${JSON.stringify(result)}`);
    }).catch((err) => {
      this.logger.error(`Diocese sync error: ${err.message}`);
    });
    return {
      message: '교구 일정 동기화가 백그라운드에서 시작되었습니다.',
      monthsAhead,
    };
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
          category: '선교', // Default category
        },
      });
    } catch (error) {
      this.logger.error(`Failed to scrape and save ${url}: ${error.message}`);
      throw error;
    }
  }

  async findAll() {
    try {
      // 1개월 이전 행사는 제외 (과거 이벤트 노출 방지)
      // date = null 인 이벤트는 날짜 미정이므로 포함
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return await this.prisma.event.findMany({
        where: {
          OR: [
            { date: null },
            { date: { gte: oneMonthAgo } },
          ],
        },
        orderBy: [
          { date: 'asc' },    // 다가오는 행사 먼저
          { createdAt: 'desc' },
        ],
      });
    } catch (error) {
      if (error.message.includes('does not exist')) {
        this.logger.warn(
          'Table "event" not found, attempting on-the-fly creation.',
        );
        await this.nuclearReset();
        // Retry once — 메인 경로와 동일한 필터 + 정렬 적용
        const retryOneMonthAgo = new Date();
        retryOneMonthAgo.setMonth(retryOneMonthAgo.getMonth() - 1);
        return await this.prisma.event.findMany({
          where: {
            OR: [
              { date: null },
              { date: { gte: retryOneMonthAgo } },
            ],
          },
          orderBy: [
            { date: 'asc' },
            { createdAt: 'desc' },
          ],
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

  async adminCreateEvent(data: {
    title: string;
    date?: string;
    location?: string;
    aiSummary?: string;
    themeColor?: string;
    originUrl?: string;
    category?: string;
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : null,
        location: data.location ?? null,
        aiSummary: data.aiSummary ?? null,
        themeColor: data.themeColor ?? '#457B9D',
        originUrl: data.originUrl ?? null,
        category: data.category ?? '선교',
      },
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
      // Clear all potential variants to ensure clean PascalCase state
      const tables = ['Bookmark', 'Event', 'User', 'bookmark', 'event', 'user'];
      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      }

      await this.prisma.initDatabase();

      return {
        message:
          "Database reset and re-initialized with Definitive PascalCase schema.",
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
      const rawCount = await this.prisma.event.count();
      const count = Number(rawCount); // Prisma returns BigInt — must convert for JSON
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
        port: process.env.PORT,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
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
