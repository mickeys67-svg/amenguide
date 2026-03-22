import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Headers, Header, Req, ForbiddenException, BadRequestException, HttpException, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { EventsService } from './events.service';
import { SemanticSearchService } from './semantic-search.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';

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

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly semanticSearch: SemanticSearchService,
    private readonly adminAuth: AdminAuthService,
  ) { }

  // ── Static routes first (must be before :id to avoid param capture) ──────

  @Get('health')
  async health() {
    return { status: 'ok' };
  }

  @Get('diag')
  async getDiagnostics(@Headers('x-admin-key') key: string, @Headers('authorization') auth: string) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.getDiagnostics();
  }

  @Get('semantic')
  async search(@Query('q') query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.semanticSearch.search(query.slice(0, 200));
  }

  /** 세실리아 AI 잔여 사용량 확인 */
  @Get('ai-availability')
  async aiAvailability(@Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
    return this.semanticSearch.checkAvailability(ip);
  }

  /** 마음 카드 발급 (하루 3명, 1인 1회) */
  @Post('ai-heart-card')
  async aiHeartCard(@Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '0.0.0.0';
    return this.semanticSearch.claimHeartCard(ip);
  }

  @Post('ai-recommend')
  async aiRecommend(
    @Req() req: Request,
    @Body() body: {
      feeling: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    },
  ) {
    if (!body.feeling?.trim() || body.feeling.trim().length < 2) {
      throw new BadRequestException('feeling은 2자 이상 입력해 주세요');
    }
    // history 유효성: 최대 6턴, 각 content 최대 1000자
    const history = (body.history || [])
      .filter((h) => h.role === 'user' || h.role === 'assistant')
      .slice(-6)
      .map((h) => ({ role: h.role, content: (h.content || '').slice(0, 1000) }));
    return this.semanticSearch.recommend(body.feeling.slice(0, 500), history);
  }

  @Post('nuclear-reset')
  async nuclearReset(@Headers('x-admin-key') key: string, @Headers('authorization') auth: string) {
    this.adminAuth.requireAdmin(key, auth);
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException('Forbidden: nuclear-reset is disabled in production.', HttpStatus.FORBIDDEN);
    }
    return this.eventsService.nuclearReset();
  }

  @Get('async-scrape')
  async triggerAsyncScrape(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Query('url') url: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
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
  /**
   * 공개 행사 등록 (status=PENDING, 관리자 승인 필요)
   * POST /events/submit
   */
  @Post('submit')
  async submitEvent(
    @Body() body: {
      title: string;
      date?: string;
      location?: string;
      description?: string;
      originUrl?: string;
      category?: string;
      imageUrl?: string;
      submitterName?: string;
      submitterContact?: string;
    },
  ) {
    if (!body.title?.trim()) throw new BadRequestException('title is required');
    if (body.title.trim().length > 500) throw new BadRequestException('title must be 500 characters or less');
    if (body.description && body.description.trim().length > 10000) throw new BadRequestException('description must be 10,000 characters or less');
    if (body.location && body.location.trim().length > 500) throw new BadRequestException('location must be 500 characters or less');
    return this.eventsService.submitEvent(body);
  }

  /**
   * 이미지 업로드 (GCS → 공개 URL 반환)
   * POST /events/upload-image
   */
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Image files only'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    // 매직바이트 검증 (MIME 위조 방지)
    const MAGIC: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };
    const expected = MAGIC[file.mimetype];
    if (expected && !expected.every((b, i) => file.buffer[i] === b)) {
      throw new BadRequestException('파일 내용이 확장자와 일치하지 않습니다.');
    }
    return this.eventsService.uploadImage(file);
  }

  /**
   * 어드민 전체 행사 목록 (status 포함)
   * GET /events/admin/list?status=PENDING
   */
  @Get('admin/list')
  async getAdminEvents(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.getAdminEvents(status);
  }

  /**
   * 행사 승인
   * PATCH /events/admin/events/:id/approve
   */
  @Patch('admin/events/:id/approve')
  async approveEvent(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.approveEvent(id);
  }

  /**
   * 행사 거절
   * PATCH /events/admin/events/:id/reject
   */
  @Patch('admin/events/:id/reject')
  async rejectEvent(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.rejectEvent(id, body?.reason);
  }

  /**
   * 행사 일괄 승인
   * POST /events/admin/batch-approve
   */
  @Post('admin/batch-approve')
  async batchApprove(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Body() body: { ids: string[] },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    if (!body.ids?.length || body.ids.length > 100) {
      throw new BadRequestException('ids must be 1-100 items');
    }
    return this.eventsService.batchApprove(body.ids);
  }

  /**
   * 행사 일괄 거절
   * POST /events/admin/batch-reject
   */
  @Post('admin/batch-reject')
  async batchReject(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Body() body: { ids: string[]; reason?: string },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    if (!body.ids?.length || body.ids.length > 100) {
      throw new BadRequestException('ids must be 1-100 items');
    }
    return this.eventsService.batchReject(body.ids, body.reason);
  }

  /**
   * 행사 수정 (관리자)
   * PUT /events/admin/events/:id
   */
  @Put('admin/events/:id')
  async adminUpdateEvent(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: {
      title?: string;
      date?: string;
      location?: string;
      category?: string;
      aiSummary?: string;
      originUrl?: string;
      imageUrl?: string;
      themeColor?: string;
      status?: string;
    },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.adminUpdateEvent(id, body);
  }

  /**
   * 행사 삭제 (관리자)
   * DELETE /events/admin/events/:id
   */
  @Delete('admin/events/:id')
  async adminDeleteEvent(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.adminDeleteEvent(id);
  }

  /** 기존 이벤트에 교구 정보 일괄 반영 */
  @Post('admin/backfill-diocese')
  async backfillDiocese(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.backfillDiocese();
  }

  @Post('admin/reclassify')
  async reclassifyMission(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.eventsService.reclassifyMissionEvents();
  }

  @Post('admin/diocese-sync')
  async dioceseSync(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Body() body: { monthsAhead?: number },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const monthsAhead = Math.min(Math.max(Number(body?.monthsAhead ?? 3), 1), 12);
    return this.eventsService.triggerDioceseSync(monthsAhead);
  }

  @Get()
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600')
  async findAll(
    @Query('diocese') diocese?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: string,
  ) {
    const rawPs = parseInt(pageSize || '0', 10) || 0;
    const ps = rawPs > 0 ? Math.min(100, rawPs) : 0;
    const p = ps > 0 ? Math.max(1, parseInt(page || '1', 10) || 1) : 0;
    return this.eventsService.findAll(diocese, category, ps > 0 ? p : undefined, ps > 0 ? ps : undefined, sort);
  }

  // ── Admin mutation ────────────────────────────────────────────────────────

  @Post('admin/events')
  async adminCreateEvent(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
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
    this.adminAuth.requireAdmin(key, auth);
    if (!body.title?.trim()) {
      throw new BadRequestException('title is required');
    }
    return this.eventsService.adminCreateEvent(body);
  }

  // ── Dynamic :id last (avoids swallowing static routes above) ─────────────

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
