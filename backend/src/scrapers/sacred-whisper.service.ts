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
      // 1. 중복 체크 — AI 호출(비용) 전에 먼저 확인
      const existing = await this.prisma.event.findFirst({
        where: { originUrl: url },
      });
      if (existing) {
        this.logger.log(`Skipping: Event with originUrl ${url} already exists.`);
        return;
      }

      // 2. Fetch HTML
      const html = await this.baseScraper.fetchHtml(url);

      // 3. Extract Text
      const text = await this.baseScraper.extractText(html);
      this.logger.log(`Extracted text length: ${text.length} chars for ${url}`);

      // 4. AI Refinement (The expensive part)
      const result = await this.aiRefiner.refine(text);

      // AI가 skip 판단 (과거 행사, 내부 회의 등)
      if (!result) {
        this.logger.log(`AI filtered out (skip=true): ${url}`);
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
          category: ['피정','미사','강의','순례','청년','문화','선교'].includes((result as any).category)
            ? (result as any).category : '선교',
          status: 'APPROVED', // 스크래핑 행사는 즉시 공개
        } as any,
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
