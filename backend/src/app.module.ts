import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { DevModule } from './dev/dev.module';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, EventsModule, DevModule, AuthModule, AdminAuthModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
