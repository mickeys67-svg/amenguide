import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { SemanticSearchService } from './semantic-search.service';

@Module({
  imports: [ScrapersModule],
  controllers: [EventsController],
  providers: [EventsService, SemanticSearchService]
})
export class EventsModule { }
