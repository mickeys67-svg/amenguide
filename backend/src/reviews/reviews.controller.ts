import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { AuthService } from '../auth/auth.service';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly authService: AuthService,
  ) {}

  /** Bearer 토큰에서 userId 추출 */
  private requireUser(auth: string | undefined): string {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    const token = auth.slice(7);
    const userId = this.authService.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    return userId;
  }

  /** POST /reviews — 리뷰 작성 (인증 필요) */
  @Post()
  async create(
    @Headers('authorization') auth: string,
    @Body() body: { eventId: string; rating: number; content?: string },
  ) {
    const userId = this.requireUser(auth);
    return this.reviewsService.create(userId, body.eventId, body.rating, body.content);
  }

  /** GET /reviews?eventId=xxx — 이벤트별 리뷰 목록 (공개) */
  @Get()
  async findByEvent(@Query('eventId') eventId: string) {
    if (!eventId) return { reviews: [], averageRating: 0, totalCount: 0 };
    return this.reviewsService.findByEvent(eventId);
  }

  /** PUT /reviews/:id — 리뷰 수정 (본인만) */
  @Put(':id')
  async update(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { rating: number; content?: string },
  ) {
    const userId = this.requireUser(auth);
    return this.reviewsService.update(id, userId, body.rating, body.content);
  }

  /** DELETE /reviews/:id — 리뷰 삭제 (본인만) */
  @Delete(':id')
  async remove(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const userId = this.requireUser(auth);
    return this.reviewsService.remove(id, userId);
  }
}
