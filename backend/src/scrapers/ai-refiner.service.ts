import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ScrapingResult } from './interfaces/scraping-result.interface';

@Injectable()
export class AiRefinerService {
  private readonly logger = new Logger(AiRefinerService.name);
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY is missing. AI refinement will be unavailable.');
    }
  }

  /** 오늘 날짜를 주입한 동적 시스템 프롬프트 */
  private buildSystemPrompt(): string {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `You are a Korean Catholic event analyst. Today is ${today}.
Extract event details from the input.
ONLY extract if this is a FUTURE or very recent (within 2 weeks past) Catholic event, retreat, lecture, pilgrimage, or program.
SKIP and return {"skip": true} if the content is:
- A past event older than 2 weeks from today
- An internal administrative meeting or committee session
- A news article about an already-completed event
- A press release without a specific upcoming event date
Otherwise return ONLY valid JSON (no markdown fences) with these fields:
- title (string): Official event name in Korean.
- date (string): ISO 8601 e.g. "2026-05-20T10:00:00". Use "1970-01-01T00:00:00" if unknown.
- location (string): Venue name and city in Korean. Use "장소 미정" if unknown.
- aiSummary (string): 2-3 Korean sentences, warm spiritual tone (은총이 가득한 따뜻한 어조).
- themeColor (string): One of #E63946 #457B9D #FFB703 #06D6A0 #C9A96E
- category (string): One of "피정" | "미사" | "강의" | "순례" | "청년" | "문화" | "선교"
  피정=피정·묵상·영성수련·성령쇄신, 미사=미사·전례·기도회·연도·강론, 강의=강좌·성경·교리·특강·세미나,
  순례=성지순례·도보순례·성당탐방, 청년=청년·청소년·Youth·성소,
  문화=음악회·공연·전시·합창·연극, 선교=선교·봉사·레지오·복음화·사회사목`;
  }

  async refine(text: string): Promise<ScrapingResult> {
    if (!this.anthropic) {
      throw new Error('AI service is not configured (missing ANTHROPIC_API_KEY).');
    }

    const contentForAi = text.slice(0, 8000);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: this.buildSystemPrompt(),
        messages: [
          { role: 'user', content: `Raw Text Chunk:\n\n${contentForAi}` },
        ],
      });

      const block = message.content[0];
      if (block.type !== 'text') throw new Error('AI returned non-text response.');

      // Strip accidental markdown fences
      const raw = block.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(raw);

      // AI가 skip 판단한 경우 null 반환 (호출자가 null 체크)
      if (parsed.skip) return null as unknown as ScrapingResult;

      const result = parsed as ScrapingResult;
      this.validateResult(result);
      return result;
    } catch (error) {
      this.logger.error(`Precision extraction failed: ${error.message}`);
      throw new Error(`Data refinement error: ${error.message}`);
    }
  }

  private validateResult(data: any): void {
    const required = ['title', 'date', 'location', 'aiSummary', 'themeColor'];
    for (const field of required) {
      if (!data[field] || typeof data[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }
    // category 기본값 보장 — 유효하지 않으면 선교로 폴백
    const validCategories = ['피정', '미사', '강의', '순례', '청년', '문화', '선교'];
    if (!data.category || !validCategories.includes(data.category)) {
      data.category = '선교';
    }

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.date)) {
      this.logger.warn(`AI returned non-ISO date: ${data.date}. Defaulting to 1970.`);
      data.date = '1970-01-01T00:00:00';
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(data.themeColor)) {
      this.logger.warn(`Invalid theme color: ${data.themeColor}. Defaulting to Gold.`);
      data.themeColor = '#C9A96E';
    }
  }
}
