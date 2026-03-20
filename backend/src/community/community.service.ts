import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityModerationService } from './community-moderation.service';
import { sanitizeHtml } from '../common/sanitize.util';

// ── 리액션 타입 정의 ─────────────────────────────────────────────────
const VALID_REACTIONS = new Set(['pray', 'love', 'peace', 'wisdom', 'grace']);

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private prisma: PrismaService,
    private moderation: CommunityModerationService,
  ) {}

  // ── 게시글 목록 (페이지네이션, 카테고리/교구 필터) ──────────────────
  async findAll(
    page: number,
    limit: number,
    category?: string,
    diocese?: string,
    search?: string,
  ) {
    const where: any = { status: 'APPROVED' };
    if (category && category !== '전체') where.category = category;
    if (diocese) where.diocese = diocese;
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    // 카테고리별 개수 조회
    const categoryCounts = await this.prisma.communityPost.groupBy({
      by: ['category'],
      where: { status: 'APPROVED' },
      _count: true,
    });
    const counts: Record<string, number> = {};
    for (const c of categoryCounts) {
      counts[c.category] = c._count;
    }

    return {
      data: data.map((p) => ({
        ...p,
        commentCount: p._count.comments,
        reactionCount: p._count.reactions,
        _count: undefined,
        // 익명 게시글이면 작성자 숨김
        author: p.isAnonymous ? { id: '', name: '익명의 신자' } : p.author,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categoryCounts: counts,
    };
  }

  // ── 게시글 상세 ────────────────────────────────────────────────────
  async findOne(id: string, userId?: string, countView = false) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        comments: {
          where: { parentId: null }, // 최상위 댓글만
          include: {
            author: { select: { id: true, name: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true } },
                reactions: true,
              },
              orderBy: { createdAt: 'asc' },
            },
            reactions: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
    });

    if (!post) return null;

    // 조회수 비동기 증가 (countView가 true일 때만)
    if (countView) {
      this.prisma.communityPost
        .update({ where: { id }, data: { viewCount: { increment: 1 } } })
        .catch(() => {});
    }

    // 리액션 요약 (타입별 개수 + 현재 유저 반응 여부)
    const reactionSummary = this.summarizeReactions(post.reactions, userId);

    return {
      ...post,
      author: post.isAnonymous ? { id: '', name: '익명의 신자' } : post.author,
      reactionSummary,
      comments: post.comments.map((c) => ({
        ...c,
        reactionSummary: this.summarizeReactions(c.reactions, userId),
        reactions: undefined,
        replies: c.replies.map((r) => ({
          ...r,
          reactionSummary: this.summarizeReactions(r.reactions, userId),
          reactions: undefined,
        })),
      })),
      reactions: undefined,
    };
  }

  // ── 리액션 요약 헬퍼 ───────────────────────────────────────────────
  private summarizeReactions(
    reactions: { type: string; userId: string }[],
    currentUserId?: string,
  ) {
    const summary: Record<string, { count: number; mine: boolean }> = {};
    for (const type of VALID_REACTIONS) {
      summary[type] = { count: 0, mine: false };
    }
    for (const r of reactions) {
      if (!summary[r.type]) summary[r.type] = { count: 0, mine: false };
      summary[r.type].count++;
      if (currentUserId && r.userId === currentUserId) {
        summary[r.type].mine = true;
      }
    }
    return summary;
  }

  // ── 은총 등급에 따른 승인 정책 ─────────────────────────────────────
  // Lv3 이상 (말씀의 벗, 봉헌자, 사도): AI 통과 → 자동 승인
  // Lv1~2 (새싹 신자, 묵주의 벗): AI 통과 → 관리자 컨펌 대기
  private readonly AUTO_APPROVE_MIN_LEVEL = 3;

  private async getUserLevel(userId: string): Promise<number> {
    const grace = await this.getUserGraceLevel(userId);
    return grace.level;
  }

  // ── 게시글 작성 (AI 모더레이션 + 등급별 승인) ───────────────────────
  async create(
    authorId: string,
    data: {
      title: string;
      content: string;
      category?: string;
      diocese?: string;
    },
  ) {
    const category = data.category || '자유게시판';

    // 1단계: AI 모더레이션 검토 (모든 유저 공통)
    const modResult = await this.moderation.moderatePost(data.title, data.content, category);

    if (modResult.status === 'REJECTED') {
      this.logger.warn(`Post rejected by AI: [${modResult.flags.join(',')}] ${modResult.reason}`);
      throw new BadRequestException(
        modResult.userMessage || '형제자매님, 작성하신 내용이 체나쿨룸 커뮤니티 가이드라인에 부합하지 않아 게시가 어렵습니다. 내용을 수정하시어 다시 시도해 주시면 감사하겠습니다. 🙏',
      );
    }

    if (modResult.flags.includes('crisis')) {
      this.logger.log(`Crisis flag detected in post by ${authorId}`);
    }

    // 2단계: 은총 등급에 따른 승인 정책
    const userLevel = await this.getUserLevel(authorId);
    let finalStatus: string;

    if (userLevel >= this.AUTO_APPROVE_MIN_LEVEL) {
      // Lv3+ (말씀의 벗, 봉헌자, 사도): AI 통과 → 자동 승인
      finalStatus = 'APPROVED';
      this.logger.log(`Post auto-approved: user ${authorId} (grace Lv${userLevel})`);
    } else {
      // Lv1~2 (새싹 신자, 묵주의 벗): AI 통과 → 관리자 컨펌 대기
      finalStatus = 'PENDING';
      this.logger.log(`Post pending review: user ${authorId} (grace Lv${userLevel})`);
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: sanitizeHtml(data.title),
        content: sanitizeHtml(data.content),
        category,
        diocese: data.diocese || null,
        isAnonymous: false,
        authorId,
        status: finalStatus,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // PENDING이면 사용자에게 안내 메시지
    if (finalStatus === 'PENDING') {
      const graceInfo = userLevel === 1 ? '새싹 신자' : '묵주의 벗';
      return {
        ...post,
        moderationNotice: `형제자매님, 현재 은총 등급(${graceInfo})에서는 관리자 승인 후 게시글이 공개됩니다. 활발한 활동으로 등급이 올라가면 자동 승인됩니다. 🙏`,
      };
    }

    return post;
  }

  // ── 게시글 수정 (AI 모더레이션 재검토) ────────────────────────────
  async update(
    id: string,
    data: { title?: string; content?: string; category?: string },
  ) {
    // 제목이나 내용이 변경되면 AI 모더레이션 재검토
    if (data.title !== undefined || data.content !== undefined) {
      const existing = await this.prisma.communityPost.findUnique({ where: { id } });
      if (existing) {
        const newTitle = data.title ?? existing.title;
        const newContent = data.content ?? existing.content;
        const newCategory = data.category ?? existing.category;
        const modResult = await this.moderation.moderatePost(newTitle, newContent, newCategory);
        if (modResult.status === 'REJECTED') {
          this.logger.warn(`Post update rejected by AI: [${modResult.flags.join(',')}] ${modResult.reason}`);
          throw new BadRequestException(
            modResult.userMessage || '형제자매님, 수정하신 내용이 커뮤니티 가이드라인에 부합하지 않습니다. 내용을 수정하시어 다시 시도해 주시면 감사하겠습니다.',
          );
        }
      }
    }

    return this.prisma.communityPost.update({
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

  // ── 게시글 삭제 (작성자/관리자) ────────────────────────────────────
  async remove(id: string) {
    return this.prisma.communityPost.update({
      where: { id },
      data: { status: 'DELETED' },
    });
  }

  // ── 게시글 숨김 (관리자) ───────────────────────────────────────────
  async hide(id: string) {
    return this.prisma.communityPost.update({
      where: { id },
      data: { status: 'HIDDEN' },
    });
  }

  // ── 게시글 고정/해제 (관리자) ──────────────────────────────────────
  async togglePin(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { isPinned: true },
    });
    if (!post) return null;
    return this.prisma.communityPost.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });
  }

  // ── 댓글 잠금/해제 (관리자) ────────────────────────────────────────
  async toggleClose(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: { isClosed: true },
    });
    if (!post) return null;
    return this.prisma.communityPost.update({
      where: { id },
      data: { isClosed: !post.isClosed },
    });
  }

  // ── 댓글 작성 ──────────────────────────────────────────────────────
  async addComment(
    postId: string,
    authorId: string,
    content: string,
    parentId?: string,
  ) {
    // 게시글 잠금 여부 확인
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { isClosed: true, status: true },
    });
    if (!post || post.status !== 'APPROVED') return null;
    if (post.isClosed) return null;

    // 1단계: AI 모더레이션 검토 (모든 유저 공통)
    const modResult = await this.moderation.moderateComment(content);

    if (modResult.status === 'REJECTED') {
      this.logger.warn(`Comment rejected by AI: [${modResult.flags.join(',')}] ${modResult.reason}`);
      throw new BadRequestException(
        modResult.userMessage || '형제자매님, 작성하신 댓글이 커뮤니티 가이드라인에 부합하지 않아 게시가 어렵습니다. 내용을 수정하시어 다시 시도해 주시면 감사하겠습니다. 🙏',
      );
    }

    if (modResult.flags.includes('crisis')) {
      this.logger.log(`Crisis flag detected in comment by ${authorId}`);
    }

    // 2단계: 은총 등급에 따른 댓글 승인 정책
    // 댓글은 Lv2 이상이면 자동 승인 (게시글보다 관대)
    const userLevel = await this.getUserLevel(authorId);
    const commentAutoApproved = userLevel >= 2;

    // parentId가 있으면 2단계 중첩인지 확인 (3단계 이상 방지)
    if (parentId) {
      const parent = await this.prisma.communityComment.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });
      if (parent?.parentId) {
        parentId = parent.parentId;
      }
    }

    const comment = await this.prisma.communityComment.create({
      data: {
        content: sanitizeHtml(content),
        authorId,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Lv1 신규 유저 댓글은 안내 표시 (댓글은 DB에 status 컬럼 없으므로 안내만)
    if (!commentAutoApproved) {
      this.logger.log(`Comment by new user ${authorId} (grace Lv${userLevel}) — monitored`);
    }

    return comment;
  }

  // ── 댓글 삭제 ──────────────────────────────────────────────────────
  async removeComment(commentId: string) {
    return this.prisma.communityComment.delete({ where: { id: commentId } });
  }

  // ── 리액션 토글 ────────────────────────────────────────────────────
  async toggleReaction(
    userId: string,
    type: string,
    postId?: string,
    commentId?: string,
  ) {
    if (!VALID_REACTIONS.has(type)) return { error: 'invalid_type' };
    if (!postId && !commentId) return { error: 'target_required' };

    // 기존 리액션 확인
    const existing = postId
      ? await this.prisma.communityReaction.findUnique({
          where: { userId_postId_type: { userId, postId, type } },
        })
      : await this.prisma.communityReaction.findUnique({
          where: { userId_commentId_type: { userId, commentId: commentId!, type } },
        });

    if (existing) {
      // 이미 있으면 제거 (토글)
      await this.prisma.communityReaction.delete({ where: { id: existing.id } });
      return { action: 'removed', type };
    } else {
      // 없으면 추가
      await this.prisma.communityReaction.create({
        data: {
          type,
          userId,
          postId: postId || null,
          commentId: commentId || null,
        },
      });
      return { action: 'added', type };
    }
  }

  // ── 관리자: 전체 목록 ──────────────────────────────────────────────
  async findAllAdmin(status?: string) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.communityPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  // ── 게시글 승인 (관리자) ───────────────────────────────────────────
  async approvePost(id: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) return null;
    return this.prisma.communityPost.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  // ── 게시글 거부 (관리자) ───────────────────────────────────────────
  async rejectPost(id: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) return null;
    return this.prisma.communityPost.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  // ── 통계 ───────────────────────────────────────────────────────────
  async getStats() {
    const [totalPosts, totalComments, totalReactions] = await Promise.all([
      this.prisma.communityPost.count({ where: { status: 'APPROVED' } }),
      this.prisma.communityComment.count(),
      this.prisma.communityReaction.count(),
    ]);
    return { totalPosts, totalComments, totalReactions };
  }

  // ── 은총 등급 계산 ─────────────────────────────────────────────────
  async getUserGraceLevel(userId: string) {
    const [postCount, commentCount, reactionsReceived] = await Promise.all([
      this.prisma.communityPost.count({ where: { authorId: userId, status: 'APPROVED' } }),
      this.prisma.communityComment.count({ where: { authorId: userId } }),
      this.prisma.communityReaction.count({
        where: {
          post: { authorId: userId },
        },
      }),
    ]);

    const gracePoints = postCount * 10 + commentCount * 3 + reactionsReceived * 2;

    let level: number;
    let title: string;
    let icon: string;
    if (gracePoints >= 500) {
      level = 5; title = '사도'; icon = '✝️';
    } else if (gracePoints >= 200) {
      level = 4; title = '봉헌자'; icon = '🕯️';
    } else if (gracePoints >= 80) {
      level = 3; title = '말씀의 벗'; icon = '📖';
    } else if (gracePoints >= 25) {
      level = 2; title = '묵주의 벗'; icon = '📿';
    } else {
      level = 1; title = '새싹 신자'; icon = '🌱';
    }

    return { userId, gracePoints, level, title, icon, postCount, commentCount, reactionsReceived };
  }

  // ── 매일미사 자동 게시 ─────────────────────────────────────────────
  async createDailyReadingPost() {
    // 시스템 유저 찾거나 생성
    let systemUser = await this.prisma.user.findFirst({
      where: { email: 'system@catholica.kr' },
    });
    if (!systemUser) {
      systemUser = await this.prisma.user.create({
        data: {
          id: 'system-catholica',
          email: 'system@catholica.kr',
          name: 'Catholica',
          provider: 'system',
        },
      });
    }

    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = weekdays[today.getDay()];

    // 이미 오늘 게시글이 있는지 확인
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await this.prisma.communityPost.findFirst({
      where: {
        authorId: systemUser.id,
        category: '성경공부',
        createdAt: { gte: todayStart, lte: todayEnd },
        title: { startsWith: '📖' },
      },
    });
    if (existing) {
      this.logger.log('Daily reading post already exists for today.');
      return existing;
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: `📖 오늘의 말씀 묵상 — ${dateStr} (${dayOfWeek})`,
        content: `오늘 ${dateStr} ${dayOfWeek}요일의 말씀을 함께 묵상합니다.\n\n오늘 미사 독서와 복음을 읽고 느끼신 점, 묵상 내용을 자유롭게 나눠주세요.\n\n"주님, 오늘 하루도 당신의 말씀 안에서 걸어가게 하소서."\n\n💡 참고: 매일미사 독서는 한국천주교주교회의 홈페이지(cbck.or.kr)에서 확인하실 수 있습니다.`,
        category: '성경공부',
        status: 'APPROVED',
        isPinned: false,
        authorId: systemUser.id,
      },
    });

    this.logger.log(`Daily reading post created: ${post.id}`);
    return post;
  }

  // ── 시드 데이터 생성 ───────────────────────────────────────────────
  async seedData() {
    const existingCount = await this.prisma.communityPost.count();
    if (existingCount > 0) {
      return { message: '이미 데이터가 존재합니다.', count: existingCount };
    }

    // 시스템 유저 확보
    let systemUser = await this.prisma.user.findFirst({
      where: { email: 'system@catholica.kr' },
    });
    if (!systemUser) {
      systemUser = await this.prisma.user.create({
        data: {
          id: 'system-catholica',
          email: 'system@catholica.kr',
          name: 'Catholica',
          provider: 'system',
        },
      });
    }

    const seeds = [
      // ── 교리문답 ──
      {
        title: '성체성사에서 실제로 예수님의 몸과 피가 현존하시나요?',
        content: '개신교 친구가 "빵과 포도주는 상징일 뿐"이라고 하는데, 천주교에서는 어떻게 가르치나요? 실체변화(transsubstantiatio)에 대해 쉽게 설명해 주실 분 계신가요?\n\n카를로 아쿠티스 성인도 성체기적을 모아서 웹사이트를 만드셨다고 하던데, 그 내용도 궁금합니다.',
        category: '교리문답',
      },
      {
        title: '고해성사를 오래 안 봤는데 어떻게 준비하나요?',
        content: '세례 받은 지 10년이 넘었는데 고해성사를 한 번도 못 봤습니다. 너무 오래되어서 부끄럽기도 하고, 어떻게 시작해야 할지 모르겠어요.\n\n혹시 비슷한 경험 있으신 분 계시면 용기를 주세요.',
        category: '교리문답',
      },
      {
        title: '연옥에 대해 성경적 근거가 있나요?',
        content: '연옥(煉獄)이라는 개념이 성경에 직접 나오지 않는다는 말을 들었습니다. 천주교에서 연옥을 가르치는 성경적, 전통적 근거가 무엇인지 궁금합니다.\n\n마카베오서의 내용이 관련 있다고 들었는데, 자세히 알고 싶습니다.',
        category: '교리문답',
      },
      {
        title: '묵주기도 바치는 방법을 알려주세요',
        content: '냉담 신자였다가 다시 성당에 다니기 시작했는데, 묵주기도 방법을 잊어버렸습니다. 환희의 신비, 빛의 신비, 고통의 신비, 영광의 신비가 각각 언제 바치는 건지도 헷갈립니다.\n\n초보자도 쉽게 따라할 수 있게 알려주시면 감사하겠습니다.',
        category: '교리문답',
      },

      // ── 신앙나눔 ──
      {
        title: '미사 중 "이것은 내 몸이다" 할 때 눈물이 났습니다',
        content: '오늘 아침 미사에 참례했는데, 성체 축성 때 "이것은 너희를 위하여 내어 줄 내 몸이다"라는 말씀에 갑자기 눈물이 쏟아졌습니다.\n\n평소에는 그냥 지나치던 말씀이었는데, 오늘은 마치 예수님이 직접 저에게 말씀하시는 것 같았어요. 하느님의 사랑이 이렇게 가까이 계시다는 것을 새삼 느꼈습니다.\n\n주님, 감사합니다.',
        category: '신앙나눔',
      },
      {
        title: '30년 냉담 끝에 다시 성당에 갔습니다',
        content: '중학교 때 세례를 받고 30년 가까이 성당을 안 갔었습니다. 그런데 아버지가 돌아가시면서 마지막에 신부님을 찾으시더라고요. 그 모습을 보고 마음이 무너졌습니다.\n\n지난 주일, 30년 만에 미사에 갔습니다. 모든 것이 낯설었지만, "평화를 빕니다" 하며 손을 내미는 옆자리 분을 보고 여기가 내가 돌아와야 할 곳이구나 싶었습니다.\n\n비슷한 경험 있으신 분 계신가요?',
        category: '신앙나눔',
      },
      {
        title: '성지순례 다녀온 후 삶이 달라졌어요',
        content: '올해 성지순례를 다녀왔습니다. 예루살렘 골고타 언덕에 섰을 때, 2000년 전 이 자리에서 예수님이 십자가를 지셨다는 사실이 실감나면서 무릎이 꺾였습니다.\n\n돌아온 후 매일 새벽미사를 가게 되었고, 기도 생활이 완전히 달라졌습니다. 순례의 은총이 참 큽니다.',
        category: '신앙나눔',
      },

      // ── 기도요청 ──
      {
        title: '아버지 수술을 앞두고 기도를 부탁드립니다',
        content: '다음 주 월요일에 아버지께서 큰 수술을 받으십니다. 의료진도 걱정할 정도로 위험한 수술이라고 합니다.\n\n함께 기도해 주시면 큰 힘이 되겠습니다. 하느님의 치유의 손길이 아버지께 닿기를 간절히 바랍니다.\n\n"주님, 아버지를 치유해 주소서. 의료진에게 지혜를 주시고, 가족에게 평안을 주소서. 아멘."',
        category: '기도요청',
        isAnonymous: true,
      },
      {
        title: '취업 준비하는 청년들을 위해 기도해 주세요',
        content: '올해 졸업하고 취업 준비 중인데 계속 떨어지고 있습니다. 주변 친구들도 비슷한 상황이고요.\n\n하느님께서 저희에게 각자에게 맞는 길을 열어주시길 기도합니다. 같은 상황에 계신 분들, 함께 기도해요.\n\n성 요셉 성인, 노동자의 수호성인이시여, 저희를 위해 빌어주소서.',
        category: '기도요청',
      },
      {
        title: '우울증으로 힘든 시간을 보내고 있습니다',
        content: '몇 달째 우울증으로 고통받고 있습니다. 병원 치료도 받고 있지만, 영적으로도 위로가 필요합니다.\n\n"주님, 이 어둠의 터널 끝에 빛이 있다고 믿습니다. 저를 안아주소서."\n\n기도해 주시면 감사하겠습니다.',
        category: '기도요청',
        isAnonymous: true,
      },

      // ── 성경공부 ──
      {
        title: '요한복음 15장 "나는 참 포도나무" 묵상 나눔',
        content: '"나는 포도나무요 너희는 가지다. 내 안에 머무르고, 나도 그 안에 머무르는 사람은 많은 열매를 맺는다." (요한 15,5)\n\n이 말씀을 묵상하면서, "머무르다"라는 단어가 마음에 깊이 와닿았습니다. 바쁜 일상 속에서 과연 나는 주님 안에 머물러 있는가?\n\n여러분은 이 말씀을 어떻게 묵상하셨나요?',
        category: '성경공부',
      },
      {
        title: '시편 23편 "주님은 나의 목자" 필사 모임 안내',
        content: '"주님은 나의 목자, 아쉬울 것 없어라. 푸른 풀밭에 누이시고, 잔잔한 물가로 이끄시며, 내 영혼에 생기를 돋우어 주시고..." (시편 23)\n\n매주 토요일 오후 3시에 온라인 성경 필사 모임을 하고 있습니다. 함께 필사하며 말씀을 마음에 새기실 분은 댓글 남겨주세요!',
        category: '성경공부',
      },

      // ── 전례생활 ──
      {
        title: '사순시기 전례의 의미와 실천 방법',
        content: '사순시기가 다가오고 있습니다. 사순시기는 재의 수요일부터 성목요일 주님 만찬 미사 전까지 40일간의 참회와 속죄의 기간입니다.\n\n전통적인 사순시기 실천 세 가지:\n1. 기도 — 매일 묵주기도 또는 십자가의 길\n2. 단식 — 재의 수요일과 성금요일 대재, 금요일 소재\n3. 자선 — 가난한 이웃을 위한 나눔\n\n올해 사순시기에 어떤 실천을 계획하고 계신가요?',
        category: '전례생활',
      },
      {
        title: '성체조배 경험을 나눠주세요',
        content: '저는 매주 목요일 저녁에 본당 성체조배에 참여하고 있습니다. 처음에는 한 시간이 너무 길게 느껴졌는데, 지금은 오히려 시간이 모자랍니다.\n\n성체 앞에서 조용히 기도하면 마음의 평화가 찾아옵니다. 카를로 아쿠티스 성인도 "성체는 천국으로 향하는 나의 고속도로"라고 하셨죠.\n\n성체조배 경험이 있으신 분들, 나눠주세요!',
        category: '전례생활',
      },

      // ── 자유게시판 ──
      {
        title: '가톨릭 영화 추천해 주세요!',
        content: '신앙 관련 영화를 보고 싶은데 추천 부탁드립니다!\n\n제가 본 것 중에서는:\n- 미션 (1986) — 정말 감동적이었어요\n- 침묵 (2016) — 마틴 스코세이지 감독작, 일본 순교자들의 이야기\n- 오브 갓 앤 멘 (2010) — 알제리 수도원 실화\n\n다른 좋은 영화 있으면 알려주세요!',
        category: '자유게시판',
      },
      {
        title: '본당 바자회에서 있었던 훈훈한 이야기',
        content: '지난 주말 본당 바자회에 봉사자로 참여했습니다. 한 할머니께서 떡볶이를 사시면서 "이 떡볶이 값으로 누군가를 도울 수 있으니 감사하다"고 하시더라고요.\n\n그 한마디에 봉사의 의미를 다시 생각하게 되었습니다. 작은 나눔이 모여 큰 사랑이 된다는 것을 느꼈어요.',
        category: '자유게시판',
      },
      {
        title: '천주교 성가 중 가장 좋아하는 곡은?',
        content: '여러분이 가장 좋아하는 천주교 성가는 무엇인가요?\n\n저는:\n1. "주님의 기도" — 미사 때마다 부르지만 항상 감동입니다\n2. "성모찬송" — Ave Maria, 은총이 가득하신 마리아\n3. "사랑하올 천주성체" — 성체성사의 신비를 노래하는 곡\n\n여러분의 최애 성가를 댓글로 알려주세요! 🎵',
        category: '자유게시판',
      },
    ];

    const createdPosts: any[] = [];
    for (const seed of seeds) {
      const post = await this.prisma.communityPost.create({
        data: {
          title: seed.title,
          content: seed.content,
          category: seed.category,
          status: 'APPROVED',
          isPinned: seed.category === '교리문답' && seed.title.includes('성체성사'),
          isAnonymous: (seed as any).isAnonymous || false,
          authorId: systemUser.id,
          viewCount: Math.floor(Math.random() * 100) + 10,
        },
      });
      createdPosts.push(post);
    }

    this.logger.log(`Seeded ${createdPosts.length} community posts`);
    return { message: `${createdPosts.length}개 시드 게시글 생성 완료`, count: createdPosts.length };
  }
}
