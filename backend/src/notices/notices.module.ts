import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  imports: [AuthModule, AdminAuthModule],
  controllers: [NoticesController],
  providers: [NoticesService],
})
export class NoticesModule {}
