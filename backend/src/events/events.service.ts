import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { BaseScraperService } from '../scrapers/base-scraper.service';
import { AiRefinerService } from '../scrapers/ai-refiner.service';
import { SacredWhisperService } from '../scrapers/sacred-whisper.service';
import { DioceseSyncService } from '../scrapers/diocese-sync.service';
import { normalizeCategory } from '../scrapers/scraper-constants';
import { inferDiocese } from '../scrapers/diocese-mapper';


@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private baseScraper: BaseScraperService,
    private aiRefiner: AiRefinerService,
    private sacredWhisper: SacredWhisperService,
    private dioceseSync: DioceseSyncService,
  ) { }

  onModuleInit() {
    // 매일 자정 이후 행사 종료 2일 경과한 이벤트 자동 삭제
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const run = () =>
      this.cleanupExpiredEvents().catch((err) =>
        this.logger.error(`Event cleanup failed: ${err.message}`),
      );
    run(); // 시작 시 1회 즉시 실행
    setInterval(run, ONE_DAY_MS);
  }

  /** 행사 종료 14일 후 이벤트 레코드 삭제 + Supabase Storage 이미지 삭제
   *  ★ 2일→14일: 다일간 행사(7일 피정 등) 진행 중 삭제 방지 */
  private async cleanupExpiredEvents() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 14);

    // 1. 만료된 이벤트의 Supabase 이미지 먼저 삭제
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && supabaseKey) {
      const eventsWithImages = await this.prisma.event.findMany({
        where: {
          AND: [
            { imageUrl: { not: null } },
            { date: { not: null, lt: twoDaysAgo } },
          ],
        },
        select: { id: true, imageUrl: true },
      });

      if (eventsWithImages.length > 0) {
        this.logger.log(`Cleaning images for ${eventsWithImages.length} expired event(s)`);
        const supabase = createClient(supabaseUrl, supabaseKey);
        const prefix = `${supabaseUrl}/storage/v1/object/public/event-images/`;
        // 배치 삭제 — N번 개별 remove() → 1번 remove([...all]) 으로 API 호출 절감
        const fileNames = eventsWithImages
          .filter((e) => e.imageUrl?.startsWith(prefix))
          .map((e) => e.imageUrl!.slice(prefix.length));
        if (fileNames.length > 0) {
          try {
            await supabase.storage.from('event-images').remove(fileNames);
          } catch (err) {
            this.logger.error(`Batch image delete failed: ${err.message}`);
          }
        }
      }
    }

    // 2. 만료된 이벤트 레코드 삭제 (date IS NOT NULL AND date < 2일 전)
    const deleted = await this.prisma.event.deleteMany({
      where: {
        date: { not: null, lt: twoDaysAgo },
      },
    });
    if (deleted.count > 0) {
      this.logger.log(`Deleted ${deleted.count} expired event record(s)`);
    }
  }

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
          date: result.date?.startsWith('1970') ? null : new Date(result.date),
          location: result.location,
          diocese: inferDiocese(result.location),
          aiSummary: result.aiSummary,
          themeColor: result.themeColor,
          originUrl: url,
          category: normalizeCategory(result.category),
          status: 'APPROVED', // 스크래핑 행사는 즉시 공개
        } as any,
      });
    } catch (error) {
      this.logger.error(`Failed to scrape and save ${url}: ${error.message}`);
      throw error;
    }
  }

  async findAll(diocese?: string) {
    try {
      // 만료된 이벤트는 cleanupExpiredEvents()가 매일 삭제 — 별도 날짜 필터 불필요
      // date = null 인 이벤트는 날짜 미정이므로 항상 포함
      const where: any = { status: 'APPROVED' };
      if (diocese) {
        where.diocese = diocese;
      }
      const rows = await this.prisma.event.findMany({
        where,
        orderBy: [
          { date: 'asc' },    // 다가오는 행사 먼저 (null은 마지막)
          { createdAt: 'desc' },
        ],
      });
      return this.deduplicateEvents(rows);
    } catch (error) {
      // Only trigger nuclear reset when the Event TABLE itself is missing.
      const isTableMissing =
        /relation "Event" does not exist/i.test(error.message) ||
        /relation "event" does not exist/i.test(error.message);
      if (isTableMissing) {
        this.logger.warn(
          'Table "event" not found, attempting on-the-fly creation.',
        );
        await this.nuclearReset();
        const where2: any = { status: 'APPROVED' };
        if (diocese) where2.diocese = diocese;
        const retryRows = await this.prisma.event.findMany({
          where: where2,
          orderBy: [
            { date: 'asc' },
            { createdAt: 'desc' },
          ],
        });
        return this.deduplicateEvents(retryRows);
      }
      throw error;
    }
  }

  /** title + date 조합으로 중복 제거 (가장 오래된 레코드 유지) */
  private deduplicateEvents(events: any[]): any[] {
    const seen = new Set<string>();
    return events.filter(e => {
      const dateKey = e.date ? new Date(e.date).toISOString().slice(0, 10) : 'nodate';
      const key = `${e.title}|${dateKey}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`Event with id "${id}" not found`);
    }
    return event;
  }

  async adminCreateEvent(data: {
    title: string;
    date?: string;
    location?: string;
    aiSummary?: string;
    themeColor?: string;
    originUrl?: string;
    category?: string;
    imageUrl?: string;
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : null,
        location: data.location ?? null,
        diocese: inferDiocese(data.location),
        aiSummary: data.aiSummary ?? null,
        themeColor: data.themeColor ?? '#457B9D',
        originUrl: data.originUrl ?? null,
        category: data.category ?? '선교',
        imageUrl: data.imageUrl ?? null,
        status: 'APPROVED',  // 관리자 직접 등록은 즉시 공개
      } as any,
    });
  }

  async submitEvent(data: {
    title: string;
    date?: string;
    location?: string;
    description?: string;
    originUrl?: string;
    category?: string;
    imageUrl?: string;
    submitterName?: string;
    submitterContact?: string;
  }) {
    return this.prisma.event.create({
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : null,
        location: data.location ?? null,
        diocese: inferDiocese(data.location),
        aiSummary: data.description ?? null,
        originUrl: data.originUrl ?? null,
        category: data.category ?? '피정',
        imageUrl: data.imageUrl ?? null,
        submitterName: data.submitterName ?? null,
        submitterContact: data.submitterContact ?? null,
        status: 'PENDING',  // 일반 등록은 심사 대기
      } as any,
    });
  }

  async getAdminEvents(statusFilter?: string) {
    const where: any = statusFilter ? { status: statusFilter } : {};
    return this.prisma.event.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async approveEvent(id: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: 'APPROVED' } as any,
    });
  }

  async rejectEvent(id: string, reason?: string) {
    return this.prisma.event.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason ?? null } as any,
    });
  }

  async adminUpdateEvent(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;
    if (data.originUrl !== undefined) updateData.originUrl = data.originUrl;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor;
    if (data.status !== undefined) updateData.status = data.status;
    return this.prisma.event.update({ where: { id }, data: updateData });
  }

  async adminDeleteEvent(id: string) {
    // Bookmarks cascade delete via FK
    return this.prisma.event.delete({ where: { id } });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string | null }> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey || !file) return { url: null };
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from('event-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);
      return { url: publicUrl };
    } catch (err) {
      this.logger.error(`Supabase Storage upload failed: ${err.message}`);
      return { url: null };
    }
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

      // AI가 skip 판단(과거 행사·비행사 콘텐츠)한 경우 null 반환
      if (!result) {
        throw new Error('AI skip: not an event (past, internal meeting, or no event)');
      }

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


  /** 기존 이벤트 중 diocese가 null인 것을 location에서 자동 추론하여 채움 */
  async backfillDiocese() {
    const events = await this.prisma.event.findMany({
      where: { diocese: null, location: { not: null } },
      select: { id: true, location: true },
    });
    let updated = 0;
    for (const ev of events) {
      const diocese = inferDiocese(ev.location);
      if (diocese) {
        await this.prisma.event.update({
          where: { id: ev.id },
          data: { diocese } as any,
        });
        updated++;
      }
    }
    this.logger.log(`Diocese backfill: ${updated}/${events.length} events updated`);
    return { total: events.length, updated };
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
