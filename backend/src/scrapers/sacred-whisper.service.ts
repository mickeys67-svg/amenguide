import { Injectable, Logger } from '@nestjs/common';
import { BaseScraperService } from './base-scraper.service';
import { AiRefinerService } from './ai-refiner.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SacredWhisperService {
  private readonly logger = new Logger(SacredWhisperService.name);

  constructor(
    private prisma: PrismaService,
    private baseScraper: BaseScraperService,
    private aiRefiner: AiRefinerService,
  ) { }

  async process(url: string): Promise<void> {
    this.logger.log(`Starting background async crawl for: ${url}`);

    // Execute in background without awaiting the full process in the trigger
    this.runBackgroundTask(url);
  }

  private async runBackgroundTask(url: string) {
    try {
      // 1. Fetch HTML
      const html = await this.baseScraper.fetchHtml(url);

      // 2. Extract Text
      const text = await this.baseScraper.extractText(html);
      this.logger.log(`Extracted text length: ${text.length} chars for ${url}`);

      // 3. AI Refinement (The expensive part)
      const result = await this.aiRefiner.refine(text);

      // 4. Persistence with Duplicate Prevention
      const existing = await this.prisma.event.findFirst({
        where: { originUrl: url },
      });

      if (existing) {
        this.logger.log(
          `Skipping save: Event with originUrl ${url} already exists.`,
        );
        return;
      }

      await this.prisma.event.create({
        data: {
          title: result.title,
          date: new Date(result.date),
          location: result.location,
          aiSummary: result.aiSummary,
          themeColor: result.themeColor,
          originUrl: url,
          category: '기타',
        },
      });

      this.logger.log(
        `✅ Successfully saved event: [${result.title}] with theme: ${result.themeColor}`,
      );
    } catch (error) {
      this.logger.error(`Background activity failed for ${url}: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
    }
  }
}
