import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /** 리뷰 작성 (유저당 이벤트 1개 제한) */
  async create(userId: string, eventId: string, rating: number, content?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('평점은 1~5 사이여야 합니다.');
    }

    // 이벤트 존재 확인
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('행사를 찾을 수 없습니다.');

    // 이미 리뷰 작성 여부 확인
    const existing = await this.prisma.review.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw new BadRequestException('이미 이 행사에 후기를 작성하셨습니다.');
    }

    return this.prisma.review.create({
      data: { userId, eventId, rating, content: content ?? null },
      include: { user: { select: { name: true } } },
    });
  }

  /** 특정 이벤트의 리뷰 목록 + 평균 평점 */
  async findByEvent(eventId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { eventId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg =
      reviews.length > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0;

    return { reviews, averageRating: avg, totalCount: reviews.length };
  }

  /** 리뷰 수정 (본인만) */
  async update(reviewId: string, userId: string, rating: number, content?: string) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('평점은 1~5 사이여야 합니다.');
    }

    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('후기를 찾을 수 없습니다.');
    if (review.userId !== userId) throw new ForbiddenException('본인의 후기만 수정할 수 있습니다.');

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { rating, content: content ?? null },
      include: { user: { select: { name: true } } },
    });
  }

  /** 리뷰 삭제 (본인만) */
  async remove(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('후기를 찾을 수 없습니다.');
    if (review.userId !== userId) throw new ForbiddenException('본인의 후기만 삭제할 수 있습니다.');

    return this.prisma.review.delete({ where: { id: reviewId } });
  }
}
