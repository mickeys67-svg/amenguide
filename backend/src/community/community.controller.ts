import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Headers,
  BadRequestException, ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { AuthService } from '../auth/auth.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { extractUserId, requireLogin } from '../common/auth.helpers';

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly authService: AuthService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  // ── 공개: 게시글 목록 ──────────────────────────────────────────────
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('diocese') diocese?: string,
    @Query('search') search?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.communityService.findAll(p, l, category, diocese, search);
  }

  // ── 공개: 통계 ─────────────────────────────────────────────────────
  @Get('stats')
  async getStats() {
    return this.communityService.getStats();
  }

  // ── 관리자: 전체 목록 ──────────────────────────────────────────────
  @Get('admin/list')
  async findAllAdmin(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.communityService.findAllAdmin(status);
  }

  // ── 공개: 게시글 상세 ──────────────────────────────────────────────
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
    @Query('countView') countView?: string,
  ) {
    const userId = auth ? extractUserId(this.authService, auth) : null;
    const post = await this.communityService.findOne(id, userId || undefined, countView === 'true');
    if (!post) throw new NotFoundException('글을 찾을 수 없습니다.');
    return post;
  }

  // ── 로그인: 게시글 작성 ────────────────────────────────────────────
  @Post()
  async create(
    @Headers('authorization') auth: string,
    @Body() body: {
      title: string;
      content: string;
      category?: string;
      diocese?: string;
    },
  ) {
    const userId = requireLogin(this.authService, auth);
    if (!body.title?.trim()) throw new BadRequestException('제목을 입력해주세요.');
    if (!body.content?.trim()) throw new BadRequestException('내용을 입력해주세요.');
    if (body.title.trim().length > 100) throw new BadRequestException('제목은 100자 이내로 입력해주세요.');
    if (body.content.trim().length > 10000) throw new BadRequestException('내용은 10,000자 이내로 입력해주세요.');

    return this.communityService.create(userId, {
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category,
      diocese: body.diocese,
    });
  }

  // ── 작성자/관리자: 게시글 수정 ─────────────────────────────────────
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
    @Headers('x-admin-key') key: string,
    @Body() body: { title?: string; content?: string; category?: string },
  ) {
    let isAdmin = false;
    try { this.adminAuth.requireAdmin(key, auth); isAdmin = true; } catch { /* not admin */ }

    if (!isAdmin) {
      const userId = requireLogin(this.authService, auth);
      const post = await this.communityService.findOne(id);
      if (!post) throw new NotFoundException('글을 찾을 수 없습니다.');
      if (post.authorId !== userId) throw new ForbiddenException('본인의 글만 수정할 수 있습니다.');
    }

    return this.communityService.update(id, body);
  }

  // ── 작성자/관리자: 게시글 삭제 ─────────────────────────────────────
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
    @Headers('x-admin-key') key?: string,
  ) {
    let isAdmin = false;
    try { if (key) { this.adminAuth.requireAdmin(key, auth); isAdmin = true; } } catch { /* not admin */ }

    if (!isAdmin) {
      const userId = requireLogin(this.authService, auth);
      const post = await this.communityService.findOne(id);
      if (!post) throw new NotFoundException('글을 찾을 수 없습니다.');
      if (post.authorId !== userId) throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
    }

    await this.communityService.remove(id);
    return { deleted: true };
  }

  // ── 관리자: 게시글 숨김 ────────────────────────────────────────────
  @Patch(':id/hide')
  async hide(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.communityService.hide(id);
  }

  // ── 관리자: 고정/해제 ──────────────────────────────────────────────
  @Patch(':id/pin')
  async togglePin(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const result = await this.communityService.togglePin(id);
    if (!result) throw new NotFoundException('글을 찾을 수 없습니다.');
    return result;
  }

  // ── 관리자: 댓글 잠금/해제 ─────────────────────────────────────────
  @Patch(':id/close')
  async toggleClose(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const result = await this.communityService.toggleClose(id);
    if (!result) throw new NotFoundException('글을 찾을 수 없습니다.');
    return result;
  }

  // ── 로그인: 댓글 작성 ──────────────────────────────────────────────
  @Post(':id/comments')
  async addComment(
    @Param('id') postId: string,
    @Headers('authorization') auth: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    const userId = requireLogin(this.authService, auth);
    if (!body.content?.trim()) throw new BadRequestException('댓글 내용을 입력해주세요.');
    if (body.content.trim().length > 2000) throw new BadRequestException('댓글은 2,000자 이내로 입력해주세요.');

    const comment = await this.communityService.addComment(
      postId, userId, body.content.trim(), body.parentId,
    );
    if (!comment) throw new BadRequestException('댓글을 작성할 수 없습니다. (게시글이 잠겨있거나 삭제되었습니다)');
    return comment;
  }

  // ── 관리자: 댓글 삭제 ──────────────────────────────────────────────
  @Delete('comments/:commentId')
  async removeComment(
    @Param('commentId') commentId: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    await this.communityService.removeComment(commentId);
    return { deleted: true };
  }

  // ── 로그인: 리액션 토글 ────────────────────────────────────────────
  @Post('reactions')
  async toggleReaction(
    @Headers('authorization') auth: string,
    @Body() body: { type: string; postId?: string; commentId?: string },
  ) {
    const userId = requireLogin(this.authService, auth);
    if (!body.type) throw new BadRequestException('리액션 타입을 지정해주세요.');

    const result = await this.communityService.toggleReaction(
      userId, body.type, body.postId, body.commentId,
    );
    if ('error' in result) {
      throw new BadRequestException(
        result.error === 'invalid_type'
          ? '유효하지 않은 리액션 타입입니다. (pray, love, peace, wisdom, grace)'
          : '게시글 또는 댓글을 지정해주세요.',
      );
    }
    return result;
  }

  // ── 은총 등급 조회 (본인 또는 관리자만) ──────────────────────────────
  @Get('grace/:userId')
  async getGraceLevel(
    @Param('userId') userId: string,
    @Headers('authorization') auth: string,
    @Headers('x-admin-key') key?: string,
  ) {
    // 관리자 확인
    let isAdmin = false;
    try { if (key) { this.adminAuth.requireAdmin(key, auth); isAdmin = true; } } catch { /* not admin */ }

    if (!isAdmin) {
      // 본인 확인
      const requesterId = requireLogin(this.authService, auth);
      if (requesterId !== userId) {
        throw new ForbiddenException('본인의 은총 등급만 조회할 수 있습니다.');
      }
    }
    return this.communityService.getUserGraceLevel(userId);
  }

  // ── 관리자: 시드 데이터 ────────────────────────────────────────────
  @Post('admin/seed')
  async seedData(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.communityService.seedData();
  }

  // ── 관리자: 매일미사 게시글 수동 생성 ──────────────────────────────
  @Post('admin/daily-reading')
  async createDailyReading(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.communityService.createDailyReadingPost();
  }

  // ── 관리자: 게시글 승인 (PENDING → APPROVED) ─────────────────────
  @Patch(':id/approve')
  async approvePost(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const result = await this.communityService.approvePost(id);
    if (!result) throw new NotFoundException('글을 찾을 수 없습니다.');
    return result;
  }

  // ── 관리자: 게시글 거부 (PENDING → REJECTED) ─────────────────────
  @Patch(':id/reject')
  async rejectPost(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const result = await this.communityService.rejectPost(id);
    if (!result) throw new NotFoundException('글을 찾을 수 없습니다.');
    return result;
  }
}
