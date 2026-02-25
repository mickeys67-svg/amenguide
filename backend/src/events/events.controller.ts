import { Controller, Get, Post, Body, Param, Query, Headers, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { SemanticSearchService } from './semantic-search.service';

// Domains allowed for on-demand scraping (prevents SSRF)
const SCRAPE_ALLOWLIST = [
  'bbs.catholic.or.kr',
  'www.cbck.or.kr',
  'cbck.or.kr',
  'www.catholictimes.org',
  'catholictimes.org',
  'www.pbc.co.kr',
  'pbc.co.kr',
  // 교구 사이트 (diocese sync + on-demand scrape)
  'catholicbusan.or.kr',
  'www.catholicbusan.or.kr',
  'daegu-archdiocese.or.kr',
  'www.daegu-archdiocese.or.kr',
  'www.djcatholic.or.kr',
  'djcatholic.or.kr',
  'www.gjcatholic.or.kr',
  'gjcatholic.or.kr',
];

function requireAdminKey(key: string) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || key !== adminKey) {
    throw new ForbiddenException('Invalid admin key');
  }
}

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly semanticSearch: SemanticSearchService,
  ) { }

  // ── Static routes first (must be before :id to avoid param capture) ──────

  @Get('health')
  async health() {
    return { status: 'ok' };
  }

  @Get('diag')
  async getDiagnostics() {
    return this.eventsService.getDiagnostics();
  }

  @Get('semantic')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.semanticSearch.search(query.slice(0, 200));
  }

  @Get('nuclear-reset')
  async nuclearReset(@Headers('x-admin-key') key: string) {
    requireAdminKey(key);
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Forbidden: nuclear-reset is disabled in production.' };
    }
    return this.eventsService.nuclearReset();
  }

  @Get('async-scrape')
  async triggerAsyncScrape(
    @Headers('x-admin-key') key: string,
    @Query('url') url: string,
  ) {
    requireAdminKey(key);
    if (!url) throw new BadRequestException('url query param is required');
    try {
      const { hostname } = new URL(url);
      if (!SCRAPE_ALLOWLIST.includes(hostname)) {
        throw new BadRequestException(`Domain not allowed: ${hostname}`);
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid URL');
    }
    return this.eventsService.triggerAsyncScrape(url);
  }

  /**
   * 교구 일정 대량 동기화 (백그라운드 실행)
   * POST /events/admin/diocese-sync
   * Header: x-admin-key: <ADMIN_API_KEY>
   * Body: { monthsAhead?: number }  (기본값: 3)
   */
  @Post('admin/diocese-sync')
  async dioceseSync(
    @Headers('x-admin-key') key: string,
    @Body() body: { monthsAhead?: number },
  ) {
    requireAdminKey(key);
    const monthsAhead = Math.min(Math.max(Number(body?.monthsAhead ?? 3), 1), 12);
    return this.eventsService.triggerDioceseSync(monthsAhead);
  }

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  // ── Admin mutation ────────────────────────────────────────────────────────

  @Post('admin/events')
  async adminCreateEvent(
    @Headers('x-admin-key') key: string,
    @Body() body: {
      title: string;
      date?: string;
      location?: string;
      aiSummary?: string;
      themeColor?: string;
      originUrl?: string;
      category?: string;
    },
  ) {
    requireAdminKey(key);
    if (!body.title?.trim()) {
      throw new BadRequestException('title is required');
    }
    return this.eventsService.adminCreateEvent(body);
  }

  // ── Dynamic :id last (avoids swallowing static routes above) ─────────────

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
