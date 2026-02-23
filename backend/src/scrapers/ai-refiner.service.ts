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

  async refine(text: string): Promise<ScrapingResult> {
    if (!this.anthropic) {
      throw new Error('AI service is not configured (missing ANTHROPIC_API_KEY).');
    }

    const contentForAi = text.slice(0, 8000);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are an elite Catholic event data analyst and spiritual guide.
Your mission is to extract precise event details and craft a warm, inviting summary that resonates with the Catholic faithful.

OUTPUT RULES:
1. Language: Use Korean for 'aiSummary'.
2. Return ONLY a valid JSON object (no markdown fences) with these fields:
   - title (string): Clean, official event name.
   - date (string): STRICT ISO 8601 (YYYY-MM-DDTHH:mm:ss). If unknown, use "1970-01-01T00:00:00".
   - location (string): Name of the church/venue and city. If unknown, use "장소 정보 없음".
   - aiSummary (string): 2-3 sentences in a warm, welcoming, spiritually grace-filled tone (은총이 가득하고 따뜻한 어조).
   - themeColor (string): Hex code (#E63946 Ruby, #457B9D Sapphire, #FFB703 Amber, #06D6A0 Emerald, #C9A96E Gold).
3. If the date is not found, use "1970-01-01T00:00:00".`,
        messages: [
          { role: 'user', content: `Raw Text Chunk:\n\n${contentForAi}` },
        ],
      });

      const block = message.content[0];
      if (block.type !== 'text') throw new Error('AI returned non-text response.');

      // Strip accidental markdown fences
      const raw = block.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const result = JSON.parse(raw) as ScrapingResult;

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
