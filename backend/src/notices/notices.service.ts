import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { sanitizeHtml } from '../common/sanitize.util';

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);
  private readonly supabase: ReturnType<typeof createClient> | null;

  constructor(private prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.supabase = (supabaseUrl && supabaseKey)
      ? createClient(supabaseUrl, supabaseKey)
      : null;
  }

  // ── 목록 조회 (승인된 글만, 고정글 상단) ─────────────────────────────
  async findAll(page: number, limit: number, category?: string, sort?: string) {
    const where: any = { status: 'APPROVED' };
    if (category && category !== '전체') {
      where.category = category;
    }

    // 정렬 옵션 (고정글은 항상 상단)
    const sortField = sort === 'oldest' ? { createdAt: 'asc' as const }
      : sort === 'views' ? { viewCount: 'desc' as const }
      : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ isPinned: 'desc' }, sortField],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notice.count({ where }),
    ]);

    return {
      data: data.map((n) => ({
        ...n,
        commentCount: n._count.comments,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── 상세 조회 + 조회수 증가 ──────────────────────────────────────────
  async findOne(id: string, countView = false) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });

    if (!notice) return null;

    // 조회수 비동기 증가 (countView가 true일 때만)
    if (countView) {
      this.prisma.notice
        .update({ where: { id }, data: { viewCount: { increment: 1 } } })
        .catch((e) => this.logger.warn(`조회수 증가 실패: ${e.message}`));
    }

    return notice;
  }

  // ── 글 작성 ──────────────────────────────────────────────────────────
  async create(authorId: string, data: { title: string; content: string; category?: string }) {
    return this.prisma.notice.create({
      data: {
        title: sanitizeHtml(data.title),
        content: sanitizeHtml(data.content),
        category: data.category || '일반',
        authorId,
        status: 'PENDING',
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  // ── 글 수정 (작성자 본인 또는 관리자) ────────────────────────────────
  async update(id: string, data: { title?: string; content?: string; category?: string }) {
    return this.prisma.notice.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: sanitizeHtml(data.title) }),
        ...(data.content !== undefined && { content: sanitizeHtml(data.content) }),
        ...(data.category !== undefined && { category: data.category }),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  // ── 글 삭제 (관리자만) ───────────────────────────────────────────────
  async remove(id: string) {
    // 첨부파일 Supabase 정리
    const attachments = await this.prisma.noticeAttachment.findMany({ where: { noticeId: id } });
    if (attachments.length > 0) {
      await this.deleteStorageFiles(attachments.map((a) => a.fileUrl));
    }
    return this.prisma.notice.delete({ where: { id } });
  }

  // ── 승인/거절 ────────────────────────────────────────────────────────
  async approve(id: string, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.notice.update({
      where: { id },
      data: { status },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  // ── 고정/해제 ────────────────────────────────────────────────────────
  async togglePin(id: string) {
    const notice = await this.prisma.notice.findUnique({ where: { id }, select: { isPinned: true } });
    if (!notice) return null;
    return this.prisma.notice.update({
      where: { id },
      data: { isPinned: !notice.isPinned },
    });
  }

  // ── 댓글 작성 ────────────────────────────────────────────────────────
  async addComment(noticeId: string, authorId: string, content: string) {
    return this.prisma.noticeComment.create({
      data: { content, authorId, noticeId },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  // ── 댓글 삭제 ────────────────────────────────────────────────────────
  async removeComment(commentId: string) {
    return this.prisma.noticeComment.delete({ where: { id: commentId } });
  }

  // ── 첨부파일 개수 조회 ───────────────────────────────────────────────
  async countAttachments(noticeId: string): Promise<number> {
    return this.prisma.noticeAttachment.count({ where: { noticeId } });
  }

  // ── 파일 업로드 (Supabase Storage) ───────────────────────────────────
  async uploadFile(
    noticeId: string,
    file: Express.Multer.File,
  ): Promise<{ id: string; fileName: string; fileUrl: string; fileSize: number } | null> {
    if (!this.supabase || !file) return null;

    try {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_가-힣]/g, '_');
      const storagePath = `notices/${noticeId}/${Date.now()}-${safeName}`;

      const { error } = await this.supabase.storage
        .from('event-images')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
          cacheControl: 'public, max-age=31536000, immutable',
        });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = this.supabase.storage.from('event-images').getPublicUrl(storagePath);

      const attachment = await this.prisma.noticeAttachment.create({
        data: {
          fileName: file.originalname,
          fileUrl: publicUrl,
          fileSize: file.size,
          noticeId,
        },
      });

      return attachment;
    } catch (err) {
      this.logger.error(`Notice file upload failed: ${err.message}`);
      return null;
    }
  }

  // ── 관리자: 전체 목록 (status 포함) ──────────────────────────────────
  async findAllAdmin(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.notice.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  // ── 내부: Supabase 파일 삭제 ─────────────────────────────────────────
  private async deleteStorageFiles(fileUrls: string[]) {
    if (!this.supabase) return;

    try {
      const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/event-images/`;
      const paths = fileUrls
        .filter((url) => url.startsWith(prefix))
        .map((url) => url.slice(prefix.length));

      if (paths.length > 0) {
        await this.supabase.storage.from('event-images').remove(paths);
      }
    } catch (err) {
      this.logger.error(`Storage file cleanup failed: ${err.message}`);
    }
  }
}
