import { Module } from '@nestjs/common';
import { BaseScraperService } from './base-scraper.service';
import { AiRefinerService } from './ai-refiner.service';
import { SacredWhisperService } from './sacred-whisper.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BaseScraperService, AiRefinerService, SacredWhisperService],
  exports: [BaseScraperService, AiRefinerService, SacredWhisperService],
})
export class ScrapersModule {}
