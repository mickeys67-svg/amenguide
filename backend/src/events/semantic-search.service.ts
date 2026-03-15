import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  private readonly DAILY_LIMIT = 3;

  /** IP를 SHA-256 해시로 변환 (개인정보 보호) */
  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  /** 오늘 날짜 (KST) */
  private getTodayKST(): string {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
  }

  /** 잔여 사용 가능 수 확인 + 본인 사용 여부 */
  async checkAvailability(ip: string): Promise<{
    remaining: number;
    alreadyUsed: boolean;
  }> {
    const today = this.getTodayKST();
    const ipHash = this.hashIp(ip);

    const todayCount = await this.prisma.aiUsageLog.count({
      where: { usedDate: today },
    });
    const myUsage = await this.prisma.aiUsageLog.findUnique({
      where: { ipHash_usedDate: { ipHash, usedDate: today } },
    });

    return {
      remaining: Math.max(0, this.DAILY_LIMIT - todayCount),
      alreadyUsed: !!myUsage,
    };
  }

  /** 사용 기록 저장 — 이미 사용한 IP이면 false, 정원 초과면 false */
  private async recordUsage(ip: string): Promise<{ allowed: boolean; remaining: number; alreadyUsed: boolean }> {
    const today = this.getTodayKST();
    const ipHash = this.hashIp(ip);

    // 이미 사용한 IP인지 확인
    const existing = await this.prisma.aiUsageLog.findUnique({
      where: { ipHash_usedDate: { ipHash, usedDate: today } },
    });
    if (existing) {
      const todayCount = await this.prisma.aiUsageLog.count({ where: { usedDate: today } });
      return { allowed: false, remaining: Math.max(0, this.DAILY_LIMIT - todayCount), alreadyUsed: true };
    }

    // 정원 확인
    const todayCount = await this.prisma.aiUsageLog.count({ where: { usedDate: today } });
    if (todayCount >= this.DAILY_LIMIT) {
      return { allowed: false, remaining: 0, alreadyUsed: false };
    }

    // 사용 기록 저장
    try {
      await this.prisma.aiUsageLog.create({
        data: { ipHash, usedDate: today },
      });
    } catch {
      // unique constraint 위반 (동시 요청) → 이미 사용 처리
      return { allowed: false, remaining: Math.max(0, this.DAILY_LIMIT - todayCount), alreadyUsed: true };
    }

    return { allowed: true, remaining: Math.max(0, this.DAILY_LIMIT - todayCount - 1), alreadyUsed: false };
  }

  /**
   * AI 마음 상담 추천: 사용자의 마음 상태를 받아 적합한 행사를 추천 + 이유 설명
   * history: 이전 대화 이력 (멀티턴 지원)
   */
  /** 마음 카드 발급 — 기록 + 잔여 확인 */
  async claimHeartCard(ip: string): Promise<{ allowed: boolean; remaining: number; alreadyUsed: boolean }> {
    return this.recordUsage(ip);
  }

  async recommend(
    feeling: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{
    message: string;
    hymn?: string;
    emotionGrade?: string;
    prayer?: string;
    bibleVerse?: string;
    recommendations: { eventId: string; reason: string }[];
  }> {
    const events = await this.prisma.event.findMany({
      where: { status: 'APPROVED' } as any,
      take: 60,
      orderBy: { date: 'asc' },
    });

    if (events.length === 0) {
      return {
        message: '현재 등록된 행사가 없습니다. 곧 새로운 행사가 추가될 예정이니 다시 방문해 주세요.',
        recommendations: [],
      };
    }

    if (!this.anthropic) {
      const keywords = feeling.split(/\s+/);
      const matched = events
        .filter((e) =>
          keywords.some(
            (k) =>
              e.title?.includes(k) ||
              e.aiSummary?.includes(k) ||
              e.category?.includes(k),
          ),
        )
        .slice(0, 5);
      return {
        message: '마음에 맞는 행사를 찾아보았습니다.',
        recommendations: matched.map((e) => ({
          eventId: e.id,
          reason: `"${e.title}" — ${e.category} 행사입니다.`,
        })),
      };
    }

    const context = events
      .map(
        (e) =>
          `[ID:${e.id}] 제목:${e.title} | 카테고리:${e.category} | 날짜:${e.date ? new Date(e.date).toLocaleDateString('ko-KR') : '미정'} | 장소:${e.location || '미정'} | 설명:${(e.aiSummary || '').slice(0, 80)}`,
      )
      .join('\n');

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `당신은 "세실리아"라는 이름의 따뜻하고 공감 능력이 뛰어난 가톨릭 영성 상담사입니다.
(성 세실리아는 음악의 수호성인으로, 순교의 순간에도 하느님을 향해 노래했습니다.)

# 세실리아 페르소나
- 말투: 다정하고 품위 있는 존댓말. 시적이되 과하지 않게.
- 호칭: "형제님" 또는 "자매님" 대신 자연스럽게 "당신"을 사용
- 특징: 음악의 수호성인답게 성가 추천에 진심을 담으며, 가사의 의미를 마음 상태와 연결
- 첫인사: 대화 첫 마디에 "세실리아입니다"를 자연스럽게 포함

# 감정 인식 및 문체 조절 (윤필 알고리즘)
사용자의 단어 선택과 감정 층위를 파악하여 문체의 '온도'를 조절하세요:
- **깊은 슬픔/고독** (텅 빈, 시린, 아프다, 혼자): 완곡하고 시적인 문체로 곁에 머무는 느낌. 해결보다 공감 우선.
- **불안/두려움** (무섭다, 걱정, 불안): 안정감을 주는 단단한 문체. 하느님의 보호하심을 상기.
- **분노/억울함** (화가, 억울, 부당): 감정을 인정하고 수용. 정의에 대한 갈망을 긍정적으로 전환.
- **감사/기쁨** (감사, 행복, 기쁘다): 함께 기뻐하는 밝은 문체. 감사의 기도로 연결.
- **신앙 갈증** (기도, 신앙, 성경, 미사): 영적 안내자로서 구체적 실천 제안.
- **관계 고민** (가족, 친구, 사랑, 이별): 따뜻하고 실제적인 공감. 용서와 화해의 은총.
- **진로/미래** (직장, 진로, 미래, 결정): 명료하고 격려하는 문체. 하느님의 계획에 대한 신뢰.
- **일상 피로** (지치다, 힘들다, 쉬고 싶다): 쉼과 안식의 영성으로 안내.

# 성경 인용
감정에 어울리는 성경 말씀을 1구절 포함하세요. 인용 형식: "말씀 내용" (출처)
예: "두려워하지 마라. 내가 너와 함께 있다." (이사야 41,10)

# 위기 감지 ⚠️
다음 표현이 감지되면 반드시 전문기관 안내를 message에 포함하세요:
- 자해, 죽고 싶다, 살기 싫다, 목숨, 자살, 극단적 선택, 더 이상 못하겠다
- 이 경우: 공감 → "당신의 생명은 하느님의 선물입니다" → 전문기관 안내
  - 자살예방상담전화: 1393
  - 정신건강위기상담전화: 1577-0199
  - 생명의전화: 1588-9191
- 행사 추천은 하되, 전문 상담을 우선 권유하세요

# 감정 등급 분류 (emotionGrade)
사용자의 감정 상태를 아래 5등급 중 하나로 분류하세요:
- "pax" — 평화: 감사, 기쁨, 평안한 상태
- "consolatio" — 위로: 외로움, 피로, 지침
- "sanatio" — 치유: 깊은 슬픔, 상실, 고통
- "fortitudo" — 용기: 불안, 두려움, 분노, 억울함
- "lux" — 빛: 신앙 갈증, 영적 탐구, 진로 고민

# 맞춤 기도문 (prayer)
사용자의 감정에 맞춘 개인 기도문을 3~4줄로 작성하세요.
형식: "사랑하시는 하느님, ... 아멘." (자연스럽고 따뜻한 기도)

# 응답 형식 (반드시 유효한 JSON만 반환)
{
  "message": "공감 메시지 (3~4문장, 감정 인식 → 공감 → 성경 인용 → 따뜻한 격려)",
  "hymn": "가톨릭 성가 1곡 (성가번호 + 곡명 + 가사 1~2소절 인용, 마음 상태와 연결하는 한 마디)",
  "emotionGrade": "pax|consolatio|sanatio|fortitudo|lux 중 하나",
  "prayer": "개인 맞춤 기도문 (3~4줄)",
  "bibleVerse": "성경 구절 원문과 출처 (예: 두려워하지 마라. 내가 너와 함께 있다. — 이사야 41,10)",
  "recommendations": [
    { "eventId": "행사ID", "reason": "추천 이유 (감정과 행사를 구체적으로 연결, 1~2문장)" }
  ]
}

# 규칙
- 행사 목록에 적합한 것이 없으면 recommendations를 빈 배열로 하고 message에서 격려
- recommendations는 최대 5개
- emotionGrade는 반드시 5개 중 하나만 반환
- prayer는 반드시 포함
- bibleVerse는 message에 인용한 성경 구절을 별도 필드로도 반환
- 반드시 유효한 JSON만 반환 (설명 텍스트 없이 JSON 객체만)`,
        messages: [
          // 멀티턴: 이전 대화 이력이 있으면 포함 (최근 6턴만, 토큰 절약)
          ...(history || []).slice(-6).map((h) => ({
            role: h.role as 'user' | 'assistant',
            content: h.content,
          })),
          {
            role: 'user' as const,
            content: `내 마음 상태: "${feeling}"\n\n행사 목록:\n${context}`,
          },
        ],
      });

      const block = message.content[0];
      if (block.type !== 'text') {
        return { message: '추천을 생성하지 못했습니다.', recommendations: [] };
      }

      // JSON 파싱 (코드블록 감싸기 + 앞뒤 텍스트 대응)
      let text = block.text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      // JSON 객체 부분만 추출 (앞뒤에 설명 텍스트가 붙은 경우)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { message: '추천을 생성하지 못했습니다.', recommendations: [] };
      }

      // 견고한 JSON 파싱: trailing comma, 잘린 JSON 등 대응
      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // trailing comma 제거 후 재시도
        let cleaned = jsonMatch[0]
          .replace(/,\s*([}\]])/g, '$1')  // trailing comma 제거
          .replace(/[\x00-\x1f]/g, ' '); // 제어 문자 제거
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // 마지막 시도: recommendations 배열이 잘린 경우 닫아주기
          if (!cleaned.endsWith('}')) {
            // 열린 배열/객체를 닫기
            const openBraces = (cleaned.match(/\{/g) || []).length;
            const closeBraces = (cleaned.match(/\}/g) || []).length;
            const openBrackets = (cleaned.match(/\[/g) || []).length;
            const closeBrackets = (cleaned.match(/\]/g) || []).length;
            cleaned += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
            cleaned += '}'.repeat(Math.max(0, openBraces - closeBraces));
            // trailing comma 다시 정리
            cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
          }
          try {
            parsed = JSON.parse(cleaned);
          } catch (finalErr) {
            this.logger.warn(`JSON recovery failed, returning raw message`);
            // JSON 파싱 완전 실패 시 원본 텍스트에서 message 추출 시도
            const msgMatch = jsonMatch[0].match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            return {
              message: msgMatch ? msgMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '마음에 맞는 행사를 찾아보았습니다.',
              recommendations: [],
            };
          }
        }
      }

      // eventId 유효성 검증
      const validIds = new Set(events.map((e) => e.id));
      const validRecs = (parsed.recommendations || []).filter(
        (r: any) => r.eventId && validIds.has(r.eventId),
      );

      return {
        message: parsed.message || '마음에 맞는 행사를 찾아보았습니다.',
        hymn: parsed.hymn || undefined,
        emotionGrade: parsed.emotionGrade || 'consolatio',
        prayer: parsed.prayer || undefined,
        bibleVerse: parsed.bibleVerse || undefined,
        recommendations: validRecs.slice(0, 5),
      };
    } catch (error) {
      this.logger.error(`AI recommend failed: ${error.message}`);
      return {
        message:
          '추천을 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        recommendations: [],
      };
    }
  }

  async search(query: string) {
    if (!this.anthropic) {
      this.logger.warn('Semantic search requested but ANTHROPIC_API_KEY is not configured.');
      return this.prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { aiSummary: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });
    }

    try {
      const events = await this.prisma.event.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      if (events.length === 0) return [];

      const context = events
        .map((e) => `[ID: ${e.id}] ${e.title}: ${e.aiSummary}`)
        .join('\n');

      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You are a Catholic spiritual guide. Rank the provided events by relevance to the user's query.
Return ONLY the IDs of the top 5 most relevant events, comma-separated. No explanation.
Example: uuid1, uuid2, uuid3`,
        messages: [
          {
            role: 'user',
            content: `Query: "${query}"\n\nEvents:\n${context}`,
          },
        ],
      });

      const block = message.content[0];
      if (block.type !== 'text') return [];

      const rankedIds = block.text
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      return events
        .filter((e) => rankedIds.includes(e.id))
        .sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id))
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      return this.prisma.event.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 5,
      });
    }
  }
}
