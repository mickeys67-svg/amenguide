import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { DevModule } from './dev/dev.module';

@Module({
  imports: [PrismaModule, EventsModule, DevModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule { }
