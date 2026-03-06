import {
  Controller, Get, Post, Body, Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthService } from '../auth/auth.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  private requireUser(auth: string | undefined): string {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }
    const token = auth.slice(7);
    const userId = this.authService.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    return userId;
  }

  /** POST /notifications/subscribe — 푸시 구독 등록 */
  @Post('subscribe')
  async subscribe(
    @Headers('authorization') auth: string,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    const userId = this.requireUser(auth);
    return this.notificationService.subscribe(userId, body);
  }

  /** POST /notifications/unsubscribe — 푸시 구독 해제 */
  @Post('unsubscribe')
  async unsubscribe(
    @Headers('authorization') auth: string,
    @Body() body: { endpoint: string },
  ) {
    const userId = this.requireUser(auth);
    return this.notificationService.unsubscribe(userId, body.endpoint);
  }

  /** GET /notifications/status — 구독 상태 확인 */
  @Get('status')
  async getStatus(@Headers('authorization') auth: string) {
    const userId = this.requireUser(auth);
    return this.notificationService.getStatus(userId);
  }

  /** GET /notifications/vapid-key — 공개 VAPID 키 반환 */
  @Get('vapid-key')
  async getVapidKey() {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    };
  }
}
