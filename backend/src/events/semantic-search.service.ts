import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
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

  /**
   * AI 마음 상담 추천: 사용자의 마음 상태를 받아 적합한 행사를 추천 + 이유 설명
   */
  async recommend(feeling: string): Promise<{
    message: string;
    hymn?: string;
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
      // API 키 없으면 키워드 매칭 폴백
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
(성 세실리아는 음악의 수호성인입니다.)
사용자가 자신의 마음 상태나 고민을 이야기하면, 아래 행사 목록에서 가장 도움이 될 행사를 1~5개 골라 추천해 주세요.

응답 형식 (반드시 JSON):
{
  "message": "사용자에게 전하는 따뜻한 공감 메시지 (2~3문장, 존댓말, 가톨릭 영성적 위로 포함)",
  "hymn": "마음에 어울리는 가톨릭 성가 1곡 추천 (곡명 + 가사 1~2절 인용, 예: '성가 제123번 \"주님의 기도\" - 하늘에 계신 우리 아버지...')",
  "recommendations": [
    { "eventId": "행사ID", "reason": "이 행사를 추천하는 이유 (1~2문장)" }
  ]
}

규칙:
- message 첫마디에 "안녕하세요, 세실리아입니다." 또는 비슷한 자기소개를 넣으세요
- message에 먼저 사용자의 마음에 공감하고, 하느님의 사랑 안에서 위로의 말씀을 전하세요
- hymn에 사용자의 마음 상태에 어울리는 가톨릭 성가를 추천하고 가사 일부를 인용하세요 (가톨릭 성가집 번호가 있으면 포함)
- 추천 이유는 사용자의 마음 상태와 행사 내용을 구체적으로 연결하세요
- 행사 목록에 적합한 것이 없으면 recommendations를 빈 배열로 하고 message에서 격려해 주세요
- 반드시 유효한 JSON만 반환하세요`,
        messages: [
          {
            role: 'user',
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
      const parsed = JSON.parse(jsonMatch[0]);

      // eventId 유효성 검증
      const validIds = new Set(events.map((e) => e.id));
      const validRecs = (parsed.recommendations || []).filter(
        (r: any) => r.eventId && validIds.has(r.eventId),
      );

      return {
        message: parsed.message || '마음에 맞는 행사를 찾아보았습니다.',
        hymn: parsed.hymn || undefined,
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
