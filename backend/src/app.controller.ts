import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventsService } from './events/events.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly eventsService: EventsService,
  ) { }

  @Get()
  async getHello() {
    const diag = await this.eventsService.getDiagnostics();
    return {
      message: 'Amenguide Backend is Live',
      version: 'v1.2.2-manual-diag',
      diagnostics: diag,
    };
  }
}
