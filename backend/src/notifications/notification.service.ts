import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// web-push는 선택적 의존성 — 설치 안 되어 있으면 발송만 스킵
let webpush: any = null;
try {
  webpush = require('web-push');
} catch {
  // web-push 미설치 시 무시
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {
    // VAPID 키 설정
    if (webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL || 'admin@catholica.kr'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
      this.logger.log('VAPID keys configured for web-push');
    } else {
      this.logger.warn('web-push not configured — push notifications disabled');
    }
  }

  /** 푸시 구독 등록 */
  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    // upsert — 같은 endpoint면 업데이트
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  }

  /** 푸시 구독 해제 */
  async unsubscribe(userId: string, endpoint: string) {
    try {
      await this.prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /** 현재 사용자의 구독 상태 확인 */
  async getStatus(userId: string) {
    const count = await this.prisma.pushSubscription.count({
      where: { userId },
    });
    return { subscribed: count > 0, subscriptionCount: count };
  }

  /** D-7, D-1 알림 발송 (매일 09:00 호출) */
  async sendScheduledNotifications() {
    if (!webpush) {
      this.logger.warn('web-push not installed — skipping notifications');
      return { sent: 0 };
    }

    const now = new Date();
    const d7 = new Date(now);
    d7.setDate(d7.getDate() + 7);
    const d1 = new Date(now);
    d1.setDate(d1.getDate() + 1);

    // D-7 날짜 범위: d7 00:00 ~ d7 23:59
    const d7Start = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate());
    const d7End = new Date(d7Start);
    d7End.setDate(d7End.getDate() + 1);

    // D-1 날짜 범위
    const d1Start = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const d1End = new Date(d1Start);
    d1End.setDate(d1End.getDate() + 1);

    let sent = 0;

    // D-7 알림
    sent += await this.sendNotificationsForDateRange(d7Start, d7End, 'D-7', '7일 후');

    // D-1 알림
    sent += await this.sendNotificationsForDateRange(d1Start, d1End, 'D-1', '내일');

    this.logger.log(`Scheduled notifications sent: ${sent}`);
    return { sent };
  }

  private async sendNotificationsForDateRange(
    dateStart: Date,
    dateEnd: Date,
    type: string,
    label: string,
  ): Promise<number> {
    // 해당 날짜의 행사 중 북마크된 것 찾기
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        event: {
          date: { gte: dateStart, lt: dateEnd },
          status: 'APPROVED',
        },
      },
      include: {
        event: { select: { id: true, title: true } },
        user: {
          select: {
            id: true,
            pushSubscriptions: true,
          },
        },
      },
    });

    let sentCount = 0;

    for (const bm of bookmarks) {
      if (!bm.user.pushSubscriptions.length) continue;

      // 중복 발송 방지
      const alreadySent = await this.prisma.notificationLog.findUnique({
        where: {
          userId_eventId_type: {
            userId: bm.user.id,
            eventId: bm.event.id,
            type,
          },
        },
      });
      if (alreadySent) continue;

      // 각 구독에 알림 발송
      for (const sub of bm.user.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: `${label} 행사 알림`,
              body: `"${bm.event.title}" 행사가 ${label}입니다.`,
              url: `/events/${bm.event.id}`,
              icon: '/logo.png',
            }),
          );
          sentCount++;
        } catch (err: any) {
          // 410 Gone = 구독 만료 → 삭제
          if (err.statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
          this.logger.error(`Push failed for ${sub.endpoint}: ${err.message}`);
        }
      }

      // 발송 기록
      await this.prisma.notificationLog.create({
        data: {
          userId: bm.user.id,
          eventId: bm.event.id,
          type,
        },
      }).catch(() => {}); // unique constraint 무시
    }

    return sentCount;
  }
}
