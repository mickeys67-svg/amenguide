import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

export interface ModerationResult {
  approved: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  reason?: string;       // 내부 사유 (로그용)
  userMessage?: string;  // 사용자에게 보여줄 메시지
  flags: string[];       // 감지된 플래그 목록
}

@Injectable()
export class CommunityModerationService {
  private readonly logger = new Logger(CommunityModerationService.name);
  private anthropic: Anthropic | null = null;

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI moderation disabled, auto-approving all content.');
    }
  }

  /**
   * 게시글 검토
   */
  async moderatePost(title: string, content: string, category: string): Promise<ModerationResult> {
    if (!this.anthropic) return this.autoApprove();

    const text = `[제목] ${title}\n[카테고리] ${category}\n[내용] ${content}`;
    return this.moderate(text, 'post');
  }

  /**
   * 댓글 검토
   */
  async moderateComment(content: string): Promise<ModerationResult> {
    if (!this.anthropic) return this.autoApprove();

    return this.moderate(content, 'comment');
  }

  /**
   * 규칙 기반 사전 필터 — AI 호출 없이 90% 걸러냄
   */
  private preFilter(text: string): ModerationResult | null {
    const lower = text.toLowerCase();

    // 1. 비속어/초성 욕설
    const profanity = /[ㅅㅆ][ㅂㅃ]|[ㄷㄸ][ㅊ]|[ㅈㅉ][ㄹ]|ㅂㅅ|ㅄ|시[바발빨]|씨[바발빨]|개[새세]끼|병[신싄]|미친[놈년]|꺼[져저]|닥[쳐쳐]|지[랄럴]|fuck|shit|damn|bitch/i;
    if (profanity.test(text)) {
      return { approved: false, status: 'REJECTED', reason: '비속어 감지', userMessage: '형제자매님, 부적절한 표현이 포함되어 게시가 어렵습니다. 내용을 수정해 주세요. 🙏', flags: ['profanity'] };
    }

    // 2. 개인정보 (전화번호, 계좌번호, 주민번호)
    const pii = /\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}|\d{6}[-]?\d{7}|\d{3}[-]?\d{2}[-]?\d{5}/;
    if (pii.test(text)) {
      return { approved: false, status: 'REJECTED', reason: '개인정보 감지', userMessage: '형제자매님, 개인정보(전화번호, 주민번호 등)가 포함되어 있습니다. 보호를 위해 삭제 후 다시 작성해 주세요. 🙏', flags: ['pii'] };
    }

    // 3. 이단/사이비 키워드
    const cult = /신천지|여호와의?\s*증인|통일교|하나님의?\s*교회|전능신|안상홍|이만희|문선명/;
    if (cult.test(text)) {
      return { approved: false, status: 'REJECTED', reason: '이단/사이비 관련 내용', userMessage: '형제자매님, 천주교 커뮤니티에 적합하지 않은 내용이 감지되었습니다. 🙏', flags: ['cult'] };
    }

    // 4. 외부 링크 (천주교 공식 사이트 제외)
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = text.match(urlPattern) || [];
    const allowedDomains = ['cbck.or.kr', 'vatican.va', 'catholica.kr', 'catholic.or.kr'];
    const hasBlockedUrl = urls.some(url => !allowedDomains.some(d => url.includes(d)));
    if (hasBlockedUrl) {
      return { approved: false, status: 'PENDING', reason: '외부 링크 포함 — 관리자 검토 필요', userMessage: '형제자매님, 외부 링크가 포함되어 관리자 검토 후 공개됩니다. 🙏', flags: ['external_link'] };
    }

    // 5. 너무 짧은 글 (스팸 가능성)
    if (text.replace(/\s/g, '').length < 5) {
      return { approved: false, status: 'REJECTED', reason: '내용 너무 짧음', userMessage: '형제자매님, 내용이 너무 짧습니다. 조금 더 작성해 주세요. 🙏', flags: ['too_short'] };
    }

    // 규칙에 안 걸리면 null → AI 호출
    return null;
  }

  /**
   * AI 모더레이션 실행 (규칙 필터 통과 후에만)
   */
  private async moderate(text: string, type: 'post' | 'comment'): Promise<ModerationResult> {
    // 규칙 기반 사전 필터
    const preResult = this.preFilter(text);
    if (preResult) {
      this.logger.log(`Pre-filter caught: ${preResult.flags.join(', ')}`);
      return preResult;
    }

    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        temperature: 0,
        system: MODERATION_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `다음 ${type === 'post' ? '게시글' : '댓글'}을 검토해주세요:\n\n${text}`,
          },
        ],
      });

      const raw = (response.content[0] as any)?.text || '';
      return this.parseResponse(raw);
    } catch (err: any) {
      this.logger.error(`Moderation API error: ${err.message}`);
      // API 오류 시 자동 승인 (서비스 중단 방지)
      return this.autoApprove();
    }
  }

  /**
   * AI 응답 파싱
   */
  private parseResponse(raw: string): ModerationResult {
    try {
      // JSON 블록 추출
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn(`Moderation response not JSON: ${raw.slice(0, 200)}`);
        return this.autoApprove();
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const verdict: string = (parsed.verdict || 'approve').toLowerCase();
      const flags: string[] = parsed.flags || [];
      const reason: string = parsed.reason || '';
      const userMessage: string = parsed.userMessage || '';

      if (verdict === 'reject') {
        return {
          approved: false,
          status: 'REJECTED',
          reason,
          userMessage: userMessage || '형제자매님, 작성하신 내용이 체나쿨룸 커뮤니티 가이드라인에 부합하지 않아 게시가 어렵습니다. 내용을 수정하시어 다시 시도해 주시면 감사하겠습니다. 주님의 평화가 함께하시길 바랍니다. 🙏',
          flags,
        };
      }

      if (verdict === 'review') {
        return {
          approved: false,
          status: 'PENDING',
          reason,
          userMessage: userMessage || '형제자매님, 작성하신 글이 검토 대기 중입니다. 관리자 확인 후 공개됩니다. 잠시만 기다려 주세요. 🙏',
          flags,
        };
      }

      // approve
      return {
        approved: true,
        status: 'APPROVED',
        flags,
      };
    } catch (err: any) {
      this.logger.warn(`Moderation parse error: ${err.message}`);
      return this.autoApprove();
    }
  }

  /**
   * 자동 승인 (API 키 없거나 오류 시)
   */
  private autoApprove(): ModerationResult {
    return {
      approved: true,
      status: 'APPROVED',
      flags: [],
    };
  }
}

// ── 시스템 프롬프트 (최고등급 필터링) ──────────────────────────────────────
const MODERATION_SYSTEM_PROMPT = `당신은 가톨릭(천주교) 커뮤니티 "체나쿨룸(Cenaculum)"의 **최고등급 AI 콘텐츠 검열관**입니다.
이 커뮤니티는 천주교 신자들만을 위한 **거룩한 공간**이며, 조금이라도 부적절한 내용은 절대 허용하지 않습니다.
**의심스러우면 무조건 REJECT.** 안전한 글만 APPROVE합니다.

## 🟢 APPROVE (승인) — 순수한 신앙 콘텐츠만
- 순수한 기도, 묵상, 성경 나눔, 미사 체험 공유
- 천주교 교리에 관한 진지한 질문 (존중하는 태도)
- 본당/교구 행사 안내 (천주교 공식 행사만)
- 성인/복자의 가르침 공유
- 간절한 기도 요청 (아픈 마음을 나누는 글은 보호)
- 위기 상황 도움 요청 (자해/자살 관련 → APPROVE하되 flags에 "crisis" 추가)

## 🔴 REJECT (즉시 차단) — 아래 중 하나라도 해당하면 차단

### 이단/사이비
- 신천지, 여호와의증인, 통일교, 하나님의교회, 전능신교 등 사이비 관련 언급
- 천주교 교도권(교황, 공의회)의 가르침을 정면으로 부정하는 주장
- 사적 계시를 진리로 강요하는 행위
- 개신교/기타 종교 포교 활동
- "교회가 틀렸다", "교황은 거짓" 등 교회 권위 부정

### 광고/스팸
- 상품, 서비스, 앱, 웹사이트 홍보 (아무리 간접적이어도)
- 외부 링크 포함 (cbck.or.kr, vatican.va 등 공식 천주교 사이트 제외)
- 모금, 후원, 투자, 재테크 관련 내용
- 반복적이거나 무의미한 내용
- 특정 업체, 제품, 브랜드 언급

### 정치/선동
- 특정 정당, 정치인, 후보 언급
- 정치적 주장이나 사회적 선동
- 시위, 집회, 서명운동 동원
- 교회 내부 파벌/갈등 조장
- 특정 신부님/주교님 비방

### 비속어/부적절 표현
- 욕설, 비속어, 은어, 속어 (약하게라도)
- 비꼬는 말투, 빈정거림, 조롱
- 성적 암시, 폭력적 표현
- "ㅅㅂ", "ㅆ", "ㄲㅈ" 등 초성 욕설 포함
- 인터넷 비속 은어 ("ㅋㅋ" 등은 허용하되 "ㄷㅊ", "ㅈㄹ" 등은 차단)
- 타인을 향한 모든 형태의 비난/공격

### 혐오/차별
- 인종, 성별, 장애, 국적, 성적 지향 관련 차별 발언
- 특정 집단에 대한 일반화/편견 표현
- 외국인/이주민 혐오

### 개인정보
- 전화번호, 주소, 이메일, 주민번호, 계좌번호
- 실명 거론과 함께 비판/비방
- 개인 SNS 계정 홍보

### 기타 차단 대상
- 저작권 침해 가능성 있는 긴 인용 (성경, 교리서 인용은 허용)
- 의학적 조언/처방 제시 (기도 요청은 허용)
- 점, 풍수, 미신, 타로, 사주, 궁합 관련
- 음모론, 가짜뉴스, 확인되지 않은 루머
- 무의미한 글 (내용 없음, 테스트, 의미불명)
- 도박, 마약, 불법 행위 관련

## ⚠️ 핵심 원칙
1. **의심 = 차단**: 조금이라도 의심스러우면 REJECT. 안전한 글만 통과시킵니다.
2. **기도 요청 보호**: 아프고 힘든 마음을 나누는 기도 요청만은 관대하게 APPROVE.
3. **천주교 전용**: 이 커뮤니티는 천주교(가톨릭) 전용 공간입니다. 개신교 용어(하나님, 목사님 등) 사용은 그 자체로 차단하지 않되, 개신교 포교 의도가 보이면 차단.
4. **REVIEW 최소화**: REVIEW(검토 대기)는 사용하지 마세요. APPROVE 아니면 REJECT로 명확히 판정합니다.
5. **차단 메시지**: REJECT 시 userMessage를 따뜻하고 존중하는 톤으로 작성하되, 정확한 사유를 알려주세요.

## 응답 형식 (반드시 JSON만 출력)
{
  "verdict": "approve" | "reject",
  "flags": ["heresy", "spam", "ad", "political", "profanity", "hate", "privacy", "adult", "superstition", "conspiracy", "meaningless", "crisis", ...],
  "reason": "판정 사유 (한국어, 간결하게)",
  "userMessage": "사용자에게 보여줄 메시지 (reject일 때만, 따뜻하고 존중하는 톤으로)"
}`;
