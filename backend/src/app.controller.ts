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
      message: 'Amenguide Definitive Backend is Live',
      version: 'v2.0.0-GOLD',
      diagnostics: diag,
    };


  }
}
