import { Controller, Get, Post, Body, Param, Query, Headers, ForbiddenException } from '@nestjs/common';
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
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Forbidden: nuclear-reset is disabled in production.' };
    }
    return this.eventsService.nuclearReset();
  }


  @Get('async-scrape')
  async triggerAsyncScrape(@Query('url') url: string) {
    return this.eventsService.triggerAsyncScrape(url);
  }

  @Post('admin/events')
  async adminCreateEvent(
    @Headers('x-admin-key') key: string,
    @Body() body: {
      title: string;
      date?: string;
      location?: string;
      aiSummary?: string;
      themeColor?: string;
      originUrl?: string;
      category?: string;
    },
  ) {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || key !== adminKey) {
      throw new ForbiddenException('Invalid admin key');
    }
    return this.eventsService.adminCreateEvent(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
}
