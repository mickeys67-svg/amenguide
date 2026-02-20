import { Module } from '@nestjs/common';
import { BaseScraperService } from './base-scraper.service';
import { AiRefinerService } from './ai-refiner.service';

@Module({
    providers: [BaseScraperService, AiRefinerService],
    exports: [BaseScraperService, AiRefinerService],
})
export class ScrapersModule { }
