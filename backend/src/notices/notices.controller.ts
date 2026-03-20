import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Headers,
  BadRequestException, ForbiddenException, NotFoundException,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NoticesService } from './notices.service';
import { AuthService } from '../auth/auth.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { requireLogin } from '../common/auth.helpers';

@Controller('notices')
export class NoticesController {
  constructor(
    private readonly noticesService: NoticesService,
    private readonly authService: AuthService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  // ── 공개: 승인된 글 목록 ─────────────────────────────────────────────
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.noticesService.findAll(p, l, category);
  }

  // ── 관리자: 전체 목록 (status 포함) ──────────────────────────────────
  @Get('admin/list')
  async findAllAdmin(
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Query('status') status?: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    return this.noticesService.findAllAdmin(status);
  }

  // ── 공개: 상세 조회 ──────────────────────────────────────────────────
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('countView') countView?: string,
  ) {
    const notice = await this.noticesService.findOne(id, countView === 'true');
    if (!notice) throw new NotFoundException('글을 찾을 수 없습니다.');
    return notice;
  }

  // ── 로그인: 글 작성 ──────────────────────────────────────────────────
  @Post()
  async create(
    @Headers('authorization') auth: string,
    @Body() body: { title: string; content: string; category?: string },
  ) {
    const userId = requireLogin(this.authService, auth);
    if (!body.title?.trim()) throw new BadRequestException('제목을 입력해주세요.');
    if (!body.content?.trim()) throw new BadRequestException('내용을 입력해주세요.');
    return this.noticesService.create(userId, {
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category,
    });
  }

  // ── 작성자/관리자: 글 수정 ───────────────────────────────────────────
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
      const notice = await this.noticesService.findOne(id);
      if (!notice) throw new NotFoundException('글을 찾을 수 없습니다.');
      if (notice.authorId !== userId) throw new ForbiddenException('본인의 글만 수정할 수 있습니다.');
    }

    return this.noticesService.update(id, body);
  }

  // ── 관리자: 댓글 삭제 (static route → :id 보다 먼저 선언) ────────────
  @Delete('comments/:commentId')
  async removeComment(
    @Param('commentId') commentId: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    await this.noticesService.removeComment(commentId);
    return { deleted: true };
  }

  // ── 관리자: 글 삭제 ──────────────────────────────────────────────────
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const notice = await this.noticesService.findOne(id);
    if (!notice) throw new NotFoundException('글을 찾을 수 없습니다.');
    await this.noticesService.remove(id);
    return { deleted: true };
  }

  // ── 관리자: 승인/거절 ────────────────────────────────────────────────
  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    this.adminAuth.requireAdmin(key, auth);
    if (!['APPROVED', 'REJECTED'].includes(body.status)) {
      throw new BadRequestException('유효하지 않은 상태입니다.');
    }
    return this.noticesService.approve(id, body.status);
  }

  // ── 관리자: 고정/해제 ────────────────────────────────────────────────
  @Patch(':id/pin')
  async togglePin(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Headers('authorization') auth: string,
  ) {
    this.adminAuth.requireAdmin(key, auth);
    const result = await this.noticesService.togglePin(id);
    if (!result) throw new NotFoundException('글을 찾을 수 없습니다.');
    return result;
  }

  // ── 로그인: 댓글 작성 ────────────────────────────────────────────────
  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Headers('authorization') auth: string,
    @Body() body: { content: string },
  ) {
    const userId = requireLogin(this.authService, auth);
    if (!body.content?.trim()) throw new BadRequestException('댓글 내용을 입력해주세요.');
    return this.noticesService.addComment(id, userId, body.content.trim());
  }

  // ── 로그인: 파일 업로드 ──────────────────────────────────────────────
  private static readonly ALLOWED_MIME = new Set([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ]);
  private static readonly MAX_FILES_PER_NOTICE = 5;
  private static readonly MAX_FILE_SIZE = 100 * 1024; // 100KB

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 }, // 100KB
  }))
  async uploadFile(
    @Param('id') noticeId: string,
    @Headers('authorization') auth: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    requireLogin(this.authService, auth);
    if (!file) throw new BadRequestException('파일을 선택해주세요.');

    // 파일 타입 검증
    if (!NoticesController.ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('허용되지 않는 파일 형식입니다. (이미지, PDF, 문서만 가능)');
    }

    // 글당 최대 파일 수 검증
    const existing = await this.noticesService.countAttachments(noticeId);
    if (existing >= NoticesController.MAX_FILES_PER_NOTICE) {
      throw new BadRequestException(`파일은 최대 ${NoticesController.MAX_FILES_PER_NOTICE}개까지 첨부 가능합니다.`);
    }

    const result = await this.noticesService.uploadFile(noticeId, file);
    if (!result) throw new BadRequestException('파일 업로드에 실패했습니다.');
    return result;
  }
}
