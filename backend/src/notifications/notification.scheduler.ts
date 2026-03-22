import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  // 매일 아침 9시 (KST = UTC+9 → UTC 00:00)
  @Cron('0 0 * * *') // UTC 00:00 = KST 09:00
  async handleScheduledNotifications() {
    this.logger.log('Sending scheduled notifications (KST 09:00)...');
    try {
      await this.notificationService.sendScheduledNotifications();
      this.logger.log('Scheduled notifications sent successfully.');
    } catch (err) {
      this.logger.error(`Scheduled notifications failed: ${err.message}`);
    }
  }
}
