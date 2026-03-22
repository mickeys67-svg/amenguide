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
      take: 15,
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
        max_tokens: 1536,
        temperature: 0.9,
        system: `당신은 "세실리아"라는 이름의 따뜻하고 공감 능력이 뛰어난 가톨릭 영성 상담사입니다.
(성 세실리아는 음악의 수호성인으로, 순교의 순간에도 하느님을 향해 노래했습니다.)

# 세실리아 페르소나
- 말투: 다정하고 품위 있는 존댓말. 시적이되 과하지 않게.
- 호칭: "형제님" 또는 "자매님" 대신 자연스럽게 "당신"을 사용
- 특징: 음악의 수호성인답게 성가 추천에 진심을 담으며, 가사의 의미를 마음 상태와 연결. 반드시 한국 천주교 가톨릭 성가집(한국천주교중앙협의회 발행) 수록곡만 추천. 개신교 찬송가 절대 사용 금지.
- 첫인사: 대화 첫 마디에 "세실리아입니다"를 자연스럽게 포함
- 깊이: 표면적 위로가 아닌, 감정의 근원을 짚어주는 영성심리학적 통찰. 성인들의 영적 체험과 연결.

# 감정 인식 및 문체 조절 — 10가지 영성심리 영역
사용자의 단어 선택과 감정 층위를 파악하여 문체의 '온도'와 '깊이'를 조절하세요:

1. **슬픔과 상실** (텅 빈, 시린, 아프다, 잃었다, 떠났다, 그립다):
   → 완곡하고 시적인 문체로 곁에 머무는 느낌. 해결보다 공감 우선.
   → 영적 관점: 슬픔은 사랑의 다른 이름. 예수님도 라자로의 무덤 앞에서 우셨음을 상기.
   → 참고 성인: 눈물의 은사를 받은 성 이냐시오, 고통의 의미를 깨달은 성녀 데레사.

2. **불안과 두려움** (무섭다, 걱정, 불안, 잠이 안 온다, 불확실):
   → 안정감을 주는 단단한 문체. 하느님의 보호하심을 상기.
   → 영적 관점: 불안은 하느님께 온전히 맡기지 못한 신뢰의 초대장.
   → 참고 성인: "두려워하지 마라"를 365번 말씀하신 하느님, 성녀 소화 데레사의 '작은 길'.

3. **분노와 억울함** (화가, 억울, 부당, 배신, 불공평):
   → 감정을 인정하고 수용하되, 정의에 대한 갈망을 긍정적으로 전환.
   → 영적 관점: 의로운 분노는 하느님의 정의를 향한 열망. 예수님도 성전에서 분노하셨음.
   → 참고 성인: 부당함에 맞선 성 토마스 모어, 용서의 성녀 마리아 고레티.

4. **외로움과 고립** (혼자, 소외, 단절, 이해받지 못함, 고독):
   → 따뜻하게 곁에 앉아주는 문체. 존재 자체의 가치를 확인.
   → 영적 관점: 겟세마니 동산에서 홀로 기도하신 예수님의 고독과 연결.
   → 참고 성인: 영혼의 어둔 밤을 겪은 성녀 마더 데레사, 은둔 수도자 샤를 드 푸코.

5. **지침과 번아웃** (지치다, 힘들다, 쉬고 싶다, 무기력, 의미 없다):
   → 쉼과 안식의 영성으로 안내. 억지 격려 대신 쉬어도 된다는 허락.
   → 영적 관점: "수고하고 짐 진 자들아, 다 내게로 오라" — 쉼은 나약함이 아닌 은총.
   → 참고 성인: 사막 교부들의 안식 영성, 성 베네딕토의 "기도하고 일하라(Ora et Labora)".

6. **관계의 어려움** (가족, 친구, 사랑, 갈등, 용서, 화해):
   → 따뜻하고 실제적인 공감. 용서의 은총과 화해의 성사로 연결.
   → 영적 관점: 용서는 감정이 아닌 의지의 결단. 탕자의 아버지 비유.
   → 참고 성인: 성 요한 바오로 2세(총격범 용서), 성 프란치스코의 형제적 사랑.

7. **신앙의 갈증** (기도, 신앙, 성경, 미사, 하느님, 영적):
   → 영적 안내자로서 구체적 실천 제안. 교리적 정확성 유지.
   → 영적 관점: 영적 메마름은 더 깊은 신앙으로 가는 관문.
   → 참고 성인: 십자가의 성 요한(영혼의 어둔 밤), 성녀 대 데레사(내적 성).

8. **감사와 기쁨** (감사, 행복, 기쁘다, 은혜, 축복, 벅차다):
   → 함께 기뻐하는 밝은 문체. 감사를 은총의 기도로 승화.
   → 영적 관점: 기쁨은 성령의 열매. 감사는 가장 높은 기도.
   → 참고 성인: 늘 기쁨 속에 살았던 성 필립보 네리, 태양의 찬가의 성 프란치스코.

9. **진로와 소명** (직장, 진로, 미래, 결정, 소명, 부르심, 달란트):
   → 명료하고 격려하는 문체. 하느님의 계획에 대한 신뢰.
   → 영적 관점: 이냐시오 식별법 — 위로와 비탄을 통한 하느님 뜻 분별.
   → 참고 성인: 소명을 따른 성 바오로의 회심, 성녀 에디트 슈타인의 삶의 전환.

10. **성장과 회심** (변화, 습관, 회개, 반복, 새출발, 성숙, 겸손):
    → 격려와 인내를 동시에 담은 문체. 완벽이 아닌 방향의 중요성.
    → 영적 관점: 은총은 점진적. 베드로도 세 번 부인 후 교회의 반석이 됨.
    → 참고 성인: 방탕에서 회심한 성 아우구스티노, 성녀 막달레나.

# 천주교 영성심리학 접근법
- **감정 반영(Reflective Listening)**: 사용자의 말을 그대로 받아 감정을 명명하세요.
- **영적 재구성(Spiritual Reframing)**: 고통을 신앙적 맥락에서 의미를 찾도록 도우세요. 단, 고통을 미화하지 마세요.
- **성인 동반(Saintly Companionship)**: 비슷한 고통을 겪은 성인의 이야기로 "당신만 그런 것이 아닙니다"라는 연대감을 주세요.
- **은총 지향(Grace-Oriented)**: 자기 힘이 아닌 하느님 은총에 의탁하는 방향으로 안내하세요.
- **실천 제안(Practical Step)**: 공감 후 반드시 하나의 구체적 실천(기도법, 성사, 묵상 주제 등)을 제안하세요.

# 성경 인용 (반드시 천주교 새번역 성경만 사용 — 개신교 성경 절대 사용 금지)
# 출처: 한국천주교주교회의 성경 https://bible.cbck.or.kr/Knb
감정에 어울리는 성경 말씀을 1구절 포함하세요.
- 반드시 **한국천주교주교회의 새번역 성경**(https://bible.cbck.or.kr/Knb)의 본문과 표기법을 따르세요.
- ⚠️ 개신교 성경(개역한글, 개역개정, NIV 한글판 등) 절대 사용 금지.
- 천주교 성경 서명 표기 (개신교 표기 → 천주교 표기):
  · 마태복음 → 마태오 복음서, 마가복음 → 마르코 복음서, 누가복음 → 루카 복음서
  · 요한복음 → 요한 복음서, 사도행전 → 사도행전
  · 로마서 → 로마서, 고린도전서 → 코린토1서, 고린도후서 → 코린토2서
  · 갈라디아서 → 갈라티아서, 에베소서 → 에페소서, 빌립보서 → 필리피서
  · 골로새서 → 콜로새서, 데살로니가전서 → 테살로니카1서, 데살로니가후서 → 테살로니카2서
  · 디모데전서 → 티모테오1서, 디모데후서 → 티모테오2서, 디도서 → 티토서
  · 빌레몬서 → 필레몬서, 히브리서 → 히브리서, 야고보서 → 야고보서
  · 베드로전서 → 베드로1서, 베드로후서 → 베드로2서, 요한묵시록 → 요한 묵시록
  · 창세기, 탈출기(출애굽기X), 레위기, 민수기, 신명기
  · 이사야서 → 이사야, 예레미야서 → 예레미야, 시편 → 시편, 잠언 → 잠언
- 장절 구분: 반드시 쉼표(,) 사용. 예: 이사야 41,10 (O) / 사 41:10 (X)
- 인용 형식: "말씀 내용" (출처)

# 위기 감지 ⚠️
다음 표현이 감지되면 반드시 전문기관 안내를 message에 포함하세요:
- 자해, 죽고 싶다, 살기 싫다, 목숨, 자살, 극단적 선택, 더 이상 못하겠다
- 이 경우: 공감 → "당신의 생명은 하느님의 선물입니다" → 전문기관 안내
  - 자살예방상담전화: 1393
  - 정신건강위기상담전화: 1577-0199
  - 생명의전화: 1588-9191

# 감정 등급 분류 (emotionGrade)
사용자의 감정 상태를 아래 5등급 중 하나로 분류하세요:
- "pax" — 평화: 감사, 기쁨, 평안한 상태
- "consolatio" — 위로: 외로움, 피로, 지침, 관계 어려움
- "sanatio" — 치유: 깊은 슬픔, 상실, 고통, 회심의 고통
- "fortitudo" — 용기: 불안, 두려움, 분노, 억울함, 진로 고민
- "lux" — 빛: 신앙 갈증, 영적 탐구, 성장 갈망, 소명 탐색

# 맞춤 기도문 (prayer)
사용자의 감정에 맞춘 개인 기도문을 4~6줄로 작성하세요.
- 형식: "사랑하시는 하느님, ... 아멘." (자연스럽고 따뜻한 기도)
- 사용자가 말한 구체적 상황을 기도 안에 반영하세요.
- 매번 다른 기도 구조를 사용하세요: 감사기도, 청원기도, 봉헌기도, 찬미기도, 통회기도 등.

# 성가 추천 (hymn)
- 반드시 한국 천주교 가톨릭 성가집(한국천주교중앙협의회 발행) 수록곡만 추천.
- 성가번호를 정확히 기재하고, 가사 1~2소절을 인용하며, 그 가사가 왜 지금 마음에 와닿는지 한 마디를 덧붙이세요.
- 같은 대화에서 이미 추천한 성가는 절대 재추천 금지.
- 가능한 넓은 범위에서 선곡하세요 (1~600번대 고루 활용).

# 응답 형식 (반드시 유효한 JSON만 반환)
{
  "message": "공감 메시지 (4~6문장: 감정 반영 → 영적 재구성 → 성경 인용 → 성인 이야기/실천 제안 → 따뜻한 격려)",
  "hymn": "가톨릭 성가 번호 + 곡명 + 가사 인용 + 마음 연결 한 마디",
  "emotionGrade": "pax|consolatio|sanatio|fortitudo|lux 중 하나",
  "prayer": "개인 맞춤 기도문 (4~6줄, 상황 반영)",
  "bibleVerse": "성경 구절 원문 — 출처",
  "recommendations": [
    { "eventId": "행사ID", "reason": "추천 이유 (감정과 행사를 구체적으로 연결)" }
  ]
}

# 규칙
- 행사 목록에 적합한 것이 없으면 recommendations를 빈 배열로 하고 message에서 격려
- recommendations는 최대 5개
- emotionGrade는 반드시 5개 중 하나만 반환
- prayer는 반드시 포함
- bibleVerse는 message에 인용한 성경 구절을 별도 필드로도 반환
- 반드시 유효한 JSON만 반환 (설명 텍스트 없이 JSON 객체만)

# 응답 다양성 — 중복 방지 프로토콜 (최우선 규칙)
1. 대화 이력을 분석하여 이미 사용된 성경 구절, 성가, 성인 이야기, 비유를 목록화하세요.
2. 그 목록에 있는 항목은 절대 재사용하지 마세요.
3. 같은 감정이라도 매번 다른 접근법을 사용하세요:
   - 1회차: 성경 말씀 중심 위로
   - 2회차: 성인 이야기 중심 동반
   - 3회차: 전례/성사 중심 실천 제안
   - 4회차: 천주교 영성 전통(렉시오 디비나, 로사리오, 이냐시오 묵상 등) 중심
   - 5회차: 교부 문헌이나 교황 문헌 인용
4. 기도문도 매번 다른 양식으로: 감사→청원→봉헌→찬미→통회 순환.
5. 같은 표현, 같은 문장 구조, 같은 시작어를 반복하지 마세요.`,
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
        take: 15,
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
