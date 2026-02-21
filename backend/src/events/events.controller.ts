import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { SemanticSearchService } from './semantic-search.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly semanticSearch: SemanticSearchService,
  ) { }

  @Get('health')
  async health() {
    return { status: 'ok' };
  }

  @Get('diag')
  async getDiagnostics() {
    return this.eventsService.getDiagnostics();
  }

  @Get()
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get('semantic')
  async search(@Query('q') query: string) {
    return this.semanticSearch.search(query);
  }

  @Get('nuclear-reset')
  async nuclearReset() {
    return this.eventsService.nuclearReset();
  }

  @Get('async-scrape')
  async triggerAsyncScrape(@Query('url') url: string) {
    return this.eventsService.triggerAsyncScrape(url);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
