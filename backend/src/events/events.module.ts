import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { SemanticSearchService } from './semantic-search.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [ScrapersModule, AdminAuthModule],
  controllers: [EventsController],
  providers: [EventsService, SemanticSearchService],
  exports: [EventsService],
})
export class EventsModule { }

