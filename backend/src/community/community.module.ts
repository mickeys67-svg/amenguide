import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityScheduler } from './community.scheduler';
import { CommunityModerationService } from './community-moderation.service';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, AdminAuthModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityScheduler, CommunityModerationService],
})
export class CommunityModule {}
