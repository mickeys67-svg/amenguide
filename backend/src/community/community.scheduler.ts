import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CommunityService } from './community.service';

@Injectable()
export class CommunityScheduler {
  private readonly logger = new Logger(CommunityScheduler.name);

  constructor(private readonly communityService: CommunityService) {}

  // 매일 아침 6시 (한국시간 KST = UTC+9 → UTC 21:00 전날)
  @Cron('0 21 * * *') // UTC 21:00 = KST 06:00
  async handleDailyReading() {
    this.logger.log('Creating daily reading post (KST 06:00)...');
    try {
      await this.communityService.createDailyReadingPost();
      this.logger.log('Daily reading post created successfully.');
    } catch (err) {
      this.logger.error(`Daily reading post failed: ${err.message}`);
    }
  }
}
