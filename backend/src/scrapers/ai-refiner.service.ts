import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ScrapingResult } from './interfaces/scraping-result.interface';
import { normalizeCategory } from './scraper-constants';

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

IMPORTANT DATE DISTINCTION:
- "event_date" = the date the EVENT ITSELF takes place (this is what matters for skip decision)
- "publication_date" = when the notice was posted (IGNORE this for skip decisions)
- Example: A notice posted 3 months ago about an upcoming retreat SHOULD be extracted.

SKIP and return {"skip": true} if ANY of these apply:
- The event_date (not publication date) is more than 2 weeks before today (${today})
- It is purely an internal administrative/committee meeting with no public participation
- It is a news report about a COMPLETED event with no upcoming schedule info
- There is no actual event at all (editorial, petition, obituary, etc.)
- It is a NEWS ARTICLE about a person (cardinal, bishop, pope) making a statement, visit, or speech — NOT an event announcement with registration/participation info
- It is a papal prayer intention (기도지향), pastoral letter, or church document
- It is a travel review, pilgrimage review (후기/탐방기), or personal reflection
- It is a personnel appointment (임명/인사발령) or congratulatory post

Otherwise return ONLY valid JSON (no markdown fences) with these fields:
- title (string): Official event name in Korean.
- date (string): ISO 8601 date of the EVENT e.g. "2026-05-20T10:00:00". Use "1970-01-01T00:00:00" if unknown.
- location (string): Venue name and city in Korean. Use "장소 미정" if unknown. IMPORTANT: Do NOT use website navigation menu text (like "성지순례ㅣ여행후기", "피정", "교구소식") as the location — those are section titles, not venues.
- aiSummary (string): 2-3 Korean sentences, warm spiritual tone (은총이 가득한 따뜻한 어조).
- themeColor (string): One of #E63946 #457B9D #FFB703 #06D6A0 #C9A96E
- confidence (number): 0.0~1.0 — how confident you are that this is a real public event with correct category. Use 0.7+ for clear events, 0.4~0.7 for ambiguous, below 0.4 for uncertain.
- category (string): One of "피정" | "강론" | "강의" | "특강" | "피정의집" | "순례" | "청년" | "문화" | "선교" | "미사" | "뉴스"
  피정=피정·묵상·영성수련·성령쇄신·관상기도
  강론=강론·설교·사목서한·강론집
  강의=강좌·성경공부·교리·세미나·교육
  특강=특강·초청강연·공개강좌·심포지엄
  피정의집=피정의집·수련원·영성원·수도원프로그램·봉쇄피정
  순례=성지순례·도보순례·성당탐방·순례길
  청년=청년·청소년·Youth·성소·대학생
  문화=음악회·공연·전시·합창·연극·콘서트·뮤지컬·축제
  선교=선교·봉사·레지오·복음화·사회사목·자선
  미사=미사·전례·기도회·연도·성체·위령
  뉴스=교구소식·인사발령·담화·보도·성명·서한·공지·안내·채용·모집`;
  }

  async refine(text: string): Promise<ScrapingResult | null> {
    if (!this.anthropic) {
      throw new Error('AI service is not configured (missing ANTHROPIC_API_KEY).');
    }

    // 앞(제목/날짜) + 중간(본문) + 끝(문의/신청) 샘플링 → 정보 커버리지 향상
    const len = text.length;
    const parts = [
      text.slice(0, 600),                                           // 앞: 제목, 날짜, 장소
      len > 1200 ? text.slice(Math.floor(len / 2) - 300, Math.floor(len / 2) + 300) : '', // 중간: 본문
      len > 600 ? text.slice(Math.max(0, len - 400)) : '',          // 끝: 문의처, 신청방법
    ].filter(Boolean);
    const contentForAi = parts.join('\n\n---\n\n').slice(0, 1800);

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
      if (parsed.skip) return null;

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
    // category 기본값 보장 — 유효하지 않으면 뉴스로 폴백
    data.category = normalizeCategory(data.category);

    // confidence threshold — 확신도 낮으면 뉴스로 리다이렉트
    const confidence = typeof data.confidence === 'number' ? data.confidence : 0.5;
    if (confidence < 0.6 && data.category !== '뉴스') {
      this.logger.log(`Low confidence (${confidence}) for "${data.title}" — category "${data.category}" → "뉴스"`);
      data.category = '뉴스';
    }
    delete data.confidence; // DB에 저장하지 않음

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
