import { Controller, Get } from '@nestjs/common';
import { EventsService } from './events/events.service';

@Controller()
export class AppController {
  constructor(
    private readonly eventsService: EventsService,
  ) { }

  @Get()
  async getHello() {
    const diag = await this.eventsService.getDiagnostics();
    return {
      message: 'Amenguide Backend is Live',
      version: 'v3.0.0-FINAL',
      diagnostics: diag,
    };
  }
}
