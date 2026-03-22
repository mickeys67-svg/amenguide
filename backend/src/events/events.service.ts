import { Injectable, Logger, NotFoundException, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
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
  private readonly supabase: ReturnType<typeof createClient> | null;

  constructor(
    private prisma: PrismaService,
    private baseScraper: BaseScraperService,
    private aiRefiner: AiRefinerService,
    private sacredWhisper: SacredWhisperService,
    private dioceseSync: DioceseSyncService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = (supabaseUrl && supabaseKey)
      ? createClient(supabaseUrl, supabaseKey)
      : null;
  }

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

  /** 행사 종료 14일 후 이벤트 레코드 삭제 + Supabase Storage 이미지 삭제 */
  private async cleanupExpiredEvents() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    // 1. 만료된 이벤트의 Supabase 이미지 먼저 삭제
    if (this.supabase) {
      const eventsWithImages = await this.prisma.event.findMany({
        where: {
          AND: [
            { imageUrl: { not: null } },
            { date: { not: null, lt: cutoffDate } },
          ],
        },
        select: { id: true, imageUrl: true },
      });

      if (eventsWithImages.length > 0) {
        this.logger.log(`Cleaning images for ${eventsWithImages.length} expired event(s)`);
        const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/event-images/`;
        const fileNames = eventsWithImages
          .filter((e) => e.imageUrl?.startsWith(prefix))
          .map((e) => e.imageUrl!.slice(prefix.length));
        if (fileNames.length > 0) {
          try {
            await this.supabase.storage.from('event-images').remove(fileNames);
          } catch (err) {
            this.logger.error(`Batch image delete failed: ${err.message}`);
          }
        }
      }
    }

    // 2. 만료된 이벤트 레코드 삭제 (date IS NOT NULL AND date < 2일 전)
    const deleted = await this.prisma.event.deleteMany({
      where: {
        date: { not: null, lt: cutoffDate },
      },
    });
    if (deleted.count > 0) {
      this.logger.log(`Deleted ${deleted.count} expired event record(s)`);
    }
  }

  async triggerAsyncScrape(url: string) {
    this.logger.log(`Received async scrape request for URL: ${url}`);
    this.sacredWhisper.process(url).catch((err) =>
      this.logger.error(`Sacred Whisper process failed: ${err.message}`),
    ); // Don't await — runs in background
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

  async findAll(diocese?: string, category?: string, page?: number, pageSize?: number, sort?: string) {
    try {
      const where: any = { status: 'APPROVED' };
      if (diocese) where.diocese = diocese;
      if (category && category !== '전체') where.category = category;

      const orderBy = sort === 'latest'
        ? [{ createdAt: 'desc' as const }]
        : [{ date: 'asc' as const }, { createdAt: 'desc' as const }];

      // 페이지네이션 요청이면 total + categoryCounts 포함 응답
      if (page && pageSize) {
        // 카테고리별 카운트 (DB groupBy 사용)
        const baseWhere: any = { status: 'APPROVED' };
        if (diocese) baseWhere.diocese = diocese;
        const categoryGroups = await this.prisma.event.groupBy({
          by: ['category'],
          where: baseWhere,
          _count: true,
        });
        const categoryCounts: Record<string, number> = {};
        for (const g of categoryGroups) {
          categoryCounts[g.category || '뉴스'] = (categoryCounts[g.category || '뉴스'] || 0) + g._count;
        }

        // DB 페이지네이션
        const [data, total] = await Promise.all([
          this.prisma.event.findMany({
            where,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          this.prisma.event.count({ where }),
        ]);
        return { data, total, page, pageSize, categoryCounts };
      }

      // 페이지네이션 없으면 기존 호환 (배열 반환)
      const rows = await this.prisma.event.findMany({ where, orderBy });
      return this.deduplicateEvents(rows);
    } catch (error) {
      const isTableMissing =
        /relation "Event" does not exist/i.test(error.message) ||
        /relation "event" does not exist/i.test(error.message);
      if (isTableMissing) {
        this.logger.warn('Table "event" not found — running initDatabase().');
        await this.prisma.initDatabase();
        const where2: any = { status: 'APPROVED' };
        if (diocese) where2.diocese = diocese;
        if (category && category !== '전체') where2.category = category;
        const retryRows = await this.prisma.event.findMany({
          where: where2,
          orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
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
        category: data.category ?? '뉴스',
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

  async batchApprove(ids: string[]) {
    const result = await this.prisma.event.updateMany({
      where: { id: { in: ids } },
      data: { status: 'APPROVED' } as any,
    });
    return { updated: result.count };
  }

  async batchReject(ids: string[], reason?: string) {
    const result = await this.prisma.event.updateMany({
      where: { id: { in: ids } },
      data: { status: 'REJECTED', rejectionReason: reason ?? null } as any,
    });
    return { updated: result.count };
  }

  private static ALLOWED_STATUSES = ['APPROVED', 'PENDING', 'REJECTED'];

  async adminUpdateEvent(id: string, data: any) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = String(data.title).slice(0, 500);
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null;
    if (data.location !== undefined) updateData.location = String(data.location).slice(0, 500);
    if (data.category !== undefined) updateData.category = String(data.category).slice(0, 100);
    if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary ? String(data.aiSummary).slice(0, 5000) : null;
    if (data.originUrl !== undefined) updateData.originUrl = data.originUrl ? String(data.originUrl).slice(0, 2000) : null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? String(data.imageUrl).slice(0, 2000) : null;
    if (data.themeColor !== undefined) updateData.themeColor = data.themeColor ? String(data.themeColor).slice(0, 50) : null;
    if (data.status !== undefined) {
      if (!EventsService.ALLOWED_STATUSES.includes(data.status)) {
        throw new Error(`유효하지 않은 상태값: ${data.status}`);
      }
      updateData.status = data.status;
    }
    return this.prisma.event.update({ where: { id }, data: updateData });
  }

  async adminDeleteEvent(id: string) {
    // Bookmarks cascade delete via FK
    return this.prisma.event.delete({ where: { id } });
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string | null }> {
    if (!this.supabase || !file) return { url: null };
    try {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${Date.now()}-${safeName}`;
      const { error } = await this.supabase.storage
        .from('event-images')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
          cacheControl: 'public, max-age=31536000, immutable',
        });
      if (error) throw error;
      const { data: { publicUrl } } = this.supabase.storage
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
    // 프로덕션에서 절대 실행 불가
    if (process.env.NODE_ENV === 'production' || process.env.K_SERVICE) {
      throw new HttpException('프로덕션 환경에서는 사용할 수 없습니다.', HttpStatus.FORBIDDEN);
    }
    // 이중 확인: ALLOW_NUCLEAR_RESET 환경변수 필수
    if (process.env.ALLOW_NUCLEAR_RESET !== 'true') {
      throw new HttpException('ALLOW_NUCLEAR_RESET=true 환경변수가 필요합니다.', HttpStatus.FORBIDDEN);
    }
    try {
      const tables = ['Bookmark', 'Event', 'User', 'bookmark', 'event', 'user'];
      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      }
      await this.prisma.initDatabase();
      return { message: "Database reset and re-initialized." };
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
        eventCount: count,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /** 기존 '선교' 카테고리 데이터 재분류 (1회성 마이그레이션) */
  async reclassifyMissionEvents(): Promise<{ total: number; reclassified: number; details: Array<{ title: string; from: string; to: string }> }> {
    const missionEvents = await this.prisma.event.findMany({
      where: { category: '선교' },
      select: { id: true, title: true },
    });

    const details: Array<{ title: string; from: string; to: string }> = [];

    for (const evt of missionEvents) {
      const newCategory = this.detectCategoryForMigration(evt.title);
      if (newCategory !== '선교') {
        await this.prisma.event.update({
          where: { id: evt.id },
          data: { category: newCategory },
        });
        details.push({ title: evt.title, from: '선교', to: newCategory });
      }
    }

    return { total: missionEvents.length, reclassified: details.length, details };
  }

  /** detectCategory 로직 복제 (diocese-sync의 private 메서드 접근 불가) */
  private detectCategoryForMigration(title: string): string {
    const t = title.replace(/\s+/g, '');

    // 뉴스/비행사 콘텐츠
    if (/인사발령|인사이동|임명|착좌|서품식|축성식|선종|장례|부고|서거|추모미사/.test(t)) return '뉴스';
    if (/담화문|사목교서|성명서|교서|회칙|권고문|주교회의|교구장/.test(t)) return '뉴스';
    if (/교구소식|보도자료|기자회견|뉴스|취재|인터뷰|논평/.test(t)) return '뉴스';
    if (/공지사항|안내문|총회|이사회|결산|예산|통계|현황|보고서/.test(t)) return '뉴스';
    if (/사순담화|부활담화|성탄담화|평화메시지/.test(t)) return '뉴스';
    if (/후기|탐방기|체험기|소감문|방문기/.test(t)) return '뉴스';
    if (/모집공고|채용|구인|입찰|공모/.test(t)) return '뉴스';

    // 행사 카테고리
    if (/피정의집|수련원|영성원|봉쇄피정|묵주기도의집|성모피정원|이냐시오피정|수도원프로그램/.test(t)) return '피정의집';
    if (/피정|영성수련|묵상|성령쇄신|마리아의밤|관상기도|침묵피정/.test(t)) return '피정';
    if (/강론|설교|사목서한|강론집/.test(t)) return '강론';
    if (/특강|초청강연|공개강좌|심포지엄|포럼/.test(t)) return '특강';
    if (/강의|강좌|교육|세미나|렉시오|성경|교리|신학/.test(t)) return '강의';
    if (/미사|전례|기도회|성시간|연도|위령|성체거양|복사단/.test(t)) return '미사';
    if (/순례|성지|도보순례|성당탐방|순례길/.test(t)) return '순례';
    if (/청년|Youth|youth|대학|청소년|성소/.test(t)) return '청년';
    if (/음악회|공연|전시|합창|연극|음악제|뮤지컬|콘서트|축제/.test(t)) return '문화';
    if (/선교|봉사|레지오|복음화|사회사목|자선/.test(t)) return '선교';

    return '뉴스';
  }
}
