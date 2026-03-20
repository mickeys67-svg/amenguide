import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { DevModule } from './dev/dev.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationModule } from './notifications/notification.module';
import { NoticesModule } from './notices/notices.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [PrismaModule, EventsModule, DevModule, AuthModule, AdminAuthModule, ReviewsModule, NotificationModule, NoticesModule, CommunityModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
