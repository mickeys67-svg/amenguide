import { chromium } from 'playwright';
import { Client } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

interface RuleBasedResult {
  title: string;
  date: string;       // ISO or '1970-01-01T00:00:00'
  location: string;
  category: string;
  themeColor: string;
}

interface PageData {
  title: string;
  text: string;
}

interface Source {
  name: string;
  listUrl: string;
  linkFilter: (href: string) => boolean;
  maxItems: number;
  waitSelector?: string;
  bypassTitleFilter?: boolean; // 전용 행사 게시판: 제목 사전필터 건너뜀
}

interface LinkWithTitle {
  href: string;
  title: string;
}

let dbClient: Client;
let savedCount = 0;
let processedCount = 0;
let skippedByPreFilter = 0;
let aiCallCount = 0;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── 리소스 차단 ───────────────────────────────────────────────────────────────
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font', 'stylesheet']);

// ─── 행사 관련 키워드 (사전 필터 + 카테고리 분류 공용) ────────────────────────
const EVENT_KEYWORDS = [
  '피정', '강의', '강좌', '특강', '행사', '모집', '신청', '순례',
  '성경공부', '세미나', '기도회', '미사', '음악회', '공연', '축제',
  '청년', '성령', '영성', '봉사', '레지오', '교육', '안내', '캠프',
  '수련', '연수', '피정의집', '수도원', '체험', '성지', '선교',
  '전례', '묵상', '기도', '강연', '심포지엄', '성가', '합창',
];

// ─── 카테고리 키워드 매핑 ─────────────────────────────────────────────────────
const CATEGORY_RULES: [string, string[]][] = [
  ['피정',    ['피정', '묵상', '영성수련', '성령쇄신', '관상기도']],
  ['피정의집', ['봉쇄피정', '피정의집', '수련원', '영성원']],
  ['순례',    ['순례', '성지순례', '도보순례', '성당탐방']],
  ['강의',    ['강의', '강좌', '성경공부', '교리', '세미나', '교육과정', '양성']],
  ['특강',    ['특강', '초청강연', '공개강좌', '심포지엄', '포럼']],
  ['문화',    ['음악회', '공연', '합창', '콘서트', '뮤지컬', '축제', '전시', '연극']],
  ['청년',    ['청년', '청소년', '성소', 'Youth', '대학생', '중고등']],
  ['강론',    ['강론', '설교', '사목서한', '강론집']],
  ['선교',    ['선교', '봉사', '레지오', '복음화', '사회사목', '자선']],
  ['미사',    ['미사', '기도회', '전례', '연도', '성체', '위령']],
];

// 카테고리 → themeColor 매핑 (UI의 CATEGORY_COLORS와 별개로 DB 저장용)
const CATEGORY_THEME: Record<string, string> = {
  '피정': '#457B9D', '피정의집': '#457B9D', '순례': '#FFB703',
  '강의': '#06D6A0', '특강': '#E63946', '문화': '#FFB703',
  '청년': '#06D6A0', '강론': '#C9A96E', '선교': '#C9A96E', '미사': '#E63946',
};

// ─── URL 정규화 ────────────────────────────────────────────────────────────────
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'bbs.catholic.or.kr') u.searchParams.delete('num');
    return u.toString();
  } catch {
    return url;
  }
}

// ─── 과거 이벤트 필터 ─────────────────────────────────────────────────────────
const TWO_DAYS_AGO = new Date();
TWO_DAYS_AGO.setDate(TWO_DAYS_AGO.getDate() - 2);

// ═══════════════════════════════════════════════════════════════════════════════
// 규칙 기반 파서 — AI 호출 없이 핵심 필드 추출
// ═══════════════════════════════════════════════════════════════════════════════

/** 제목: og:title > h1 > <title> 순서로 추출, 사이트명 접미사 제거 */
function extractTitle(rawTitle: string, bodyFirstLine: string): string {
  const fromRaw = rawTitle.split(/[|·–—]/)[0].trim();
  if (fromRaw.length >= 5) return fromRaw;
  // fallback: 본문 첫 줄
  return bodyFirstLine.split('\n')[0].trim().slice(0, 80);
}

/** 날짜: 한국어 날짜 패턴 → ISO 8601 (미래 날짜만 채택) */
function extractDate(text: string): string {
  const today = new Date();
  const patterns: RegExp[] = [
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g,
    /(\d{4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})/g, // 구분자 사이 공백 허용 (2026. 03. 05 포함)
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);
      if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31) continue;
      const candidate = new Date(year, month - 1, day);
      // 현재 날짜 이후인 경우만 채택 (미래 행사)
      if (candidate >= today) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
      }
    }
  }
  return '1970-01-01T00:00:00'; // 날짜 미정
}

/** 장소: "장소:" 패턴 또는 장소명 키워드 앞 단어 포함 캡처 */
function extractLocation(text: string): string {
  // 패턴 1: 명시적 "장소:" 레이블
  const labelMatch = text.match(/(?:장소|개최\s*장소|행사\s*장소|주\s*소)\s*[:：]\s*([^\n\r]{4,50})/);
  if (labelMatch?.[1]) {
    const loc = labelMatch[1].trim().replace(/\s+/g, ' ');
    if (loc.length >= 3 && loc.length <= 50) return loc;
  }

  // 패턴 2: 시설명 키워드 앞에 붙은 지명까지 함께 캡처 (후행 조사 제외)
  // 예: "예수회 피정의집" / "명동 성당" / "한국 순교자 성지"
  const facilityMatch = text.match(
    /((?:[가-힣a-zA-Z0-9]+\s+){0,2}(?:피정의집|수련원|영성원|수도원|성당|성지|회관|센터|교육관|신학교|묵상의\s*집))/,
  );
  if (facilityMatch?.[1]) {
    const loc = facilityMatch[1].trim().replace(/\s+/g, ' ');
    if (loc.length >= 3 && loc.length <= 40) return loc;
  }

  return '장소 미정';
}

/** 카테고리: 제목+본문 키워드 우선순위 매핑 */
function extractCategory(title: string, text: string): string {
  const combined = title + ' ' + text.slice(0, 500);
  for (const [cat, keywords] of CATEGORY_RULES) {
    if (keywords.some((kw) => combined.includes(kw))) return cat;
  }
  return '선교'; // 기본값
}

/** 규칙 기반 전체 추출 */
function extractRuleBased(pageTitle: string, text: string): RuleBasedResult {
  const title = extractTitle(pageTitle, text);
  const date = extractDate(text);
  const location = extractLocation(text);
  const category = extractCategory(title, text);
  const themeColor = CATEGORY_THEME[category] || '#457B9D';
  return { title, date, location, category, themeColor };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI — 요약 생성만 담당 (입력 최소화)
// ═══════════════════════════════════════════════════════════════════════════════

/** AI에게 요약만 요청: 시스템 프롬프트 80토큰 + 유저 입력 200토큰 = 총 280토큰/호출 */
async function generateSummary(title: string, text: string): Promise<string> {
  if (!anthropic) return '';
  aiCallCount++;
  const today = new Date().toISOString().slice(0, 10);
  // 요약에 필요한 핵심 부분만 전달 (앞 400자)
  const snippet = text.slice(0, 400);
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `당신은 한국 가톨릭 행사 안내 작가입니다. 오늘은 ${today}입니다. 주어진 행사에 대해 은총이 가득한 따뜻한 어조로 2-3문장 한국어 요약을 작성하세요. JSON 없이 요약 텍스트만 반환하세요.`,
      messages: [{ role: 'user', content: `행사명: ${title}\n\n내용:\n${snippet}` }],
    });
    const block = message.content[0];
    return block.type === 'text' ? block.text.trim() : '';
  } catch (err) {
    console.error('[AI] Summary generation failed:', (err as Error).message);
    return '';
  }
}

// ─── AI Vision 정제 (포스터 이미지 — 텍스트 부족 시 폴백) ────────────────────
// Vision은 전체 구조화 추출이 필요하므로 기존 방식 유지
async function refineWithVision(imageData: { data: string; mimeType: string }): Promise<{
  title: string; date: string; location: string; category: string;
  themeColor: string; aiSummary: string;
} | null> {
  if (!anthropic) return null;
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
  type ValidMime = (typeof validMimeTypes)[number];
  const mimeType = validMimeTypes.includes(imageData.mimeType as ValidMime)
    ? (imageData.mimeType as ValidMime)
    : ('image/jpeg' as ValidMime);

  const today = new Date().toISOString().slice(0, 10);
  aiCallCount++;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: `You are a Korean Catholic event analyst. Today is ${today}. Return ONLY valid JSON: title, date (ISO 8601 or "1970-01-01T00:00:00"), location (or "장소 미정"), category (피정|강론|강의|특강|피정의집|순례|청년|문화|선교|미사), themeColor (#E63946|#457B9D|#FFB703|#06D6A0|#C9A96E), aiSummary (2-3 Korean sentences, warm tone). Return {"skip":true} if no event.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageData.data } },
          { type: 'text', text: '이 이미지는 가톨릭 행사 포스터입니다. 행사 정보를 추출해주세요.' },
        ],
      }],
    });
    const block = message.content[0];
    if (block.type !== 'text') return null;
    const cleaned = block.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.skip) return null;
    return parsed;
  } catch (err) {
    console.error('[VISION] Failed:', (err as Error).message);
    return null;
  }
}

// ─── 이미지 src 추출 ──────────────────────────────────────────────────────────
async function extractImageUrls(page: import('playwright').Page): Promise<string[]> {
  return page.evaluate(() => {
    const SKIP = ['icon', 'logo', 'banner_small', 'btn_', 'arrow', 'bullet', 'bg_'];
    return Array.from(document.querySelectorAll('img[src]'))
      .map((img) => (img as HTMLImageElement).src)
      .filter((src) => {
        if (!src || (!src.startsWith('http') && !src.startsWith('//'))) return false;
        return !SKIP.some((p) => src.toLowerCase().includes(p));
      });
  });
}

// ─── 이미지 다운로드 → base64 ─────────────────────────────────────────────────
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
    });
    if (!res.ok) return null;
    const mimeType = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    if (!mimeType.startsWith('image/')) return null;
    const data = Buffer.from(await res.arrayBuffer()).toString('base64');
    if (data.length > 6_000_000) return null;
    return { data, mimeType };
  } catch {
    return null;
  }
}

// ─── 페이지 이동 (재시도) ─────────────────────────────────────────────────────
async function gotoWithRetry(page: import('playwright').Page, url: string, retries = 2): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`[NAV] Failed: ${url}`, (err as Error).message);
        return false;
      }
      await page.waitForTimeout(2000 * (attempt + 1));
    }
  }
  return false;
}

// ─── 리스트 페이지 링크+제목 추출 → 제목 사전필터 ──────────────────────────
async function extractLinks(page: import('playwright').Page, source: Source): Promise<string[]> {
  try {
    console.log(`[LIST] ${source.name}: ${source.listUrl}`);
    const ok = await gotoWithRetry(page, source.listUrl);
    if (!ok) return [];

    if (source.waitSelector) {
      await page.waitForSelector(source.waitSelector, { timeout: 5000 }).catch(() => page.waitForTimeout(2000));
    } else {
      await page.waitForTimeout(2500);
    }

    const linksWithTitles: LinkWithTitle[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]')).map((a) => ({
        href: (a as HTMLAnchorElement).href,
        title: a.textContent?.trim().replace(/\s+/g, ' ') || '',
      })).filter(({ href }) => !!href),
    );

    const matched = linksWithTitles.filter(({ href }) => source.linkFilter(href));
    const preFiltered = source.bypassTitleFilter
      ? matched
      : matched.filter(({ title }) => {
          if (title.length < 4) return true; // 제목 없으면 일단 방문
          return EVENT_KEYWORDS.some((kw) => title.includes(kw));
        });

    const skipped = matched.length - preFiltered.length;
    if (skipped > 0) console.log(`[LIST] 제목 필터로 ${skipped}건 사전 제외`);

    const unique = [...new Set(preFiltered.map((l) => normalizeUrl(l.href)))].slice(0, source.maxItems);
    console.log(`[LIST] Found ${unique.length} URLs (matched: ${matched.length})`);
    return unique;
  } catch (err) {
    console.error(`[LIST] ${source.name}:`, (err as Error).message);
    return [];
  }
}

// ─── 페이지 전체 데이터 추출 (제목 + 본문 텍스트) ───────────────────────────
async function extractPageData(page: import('playwright').Page, url: string): Promise<PageData> {
  const ok = await gotoWithRetry(page, url);
  if (!ok) return { title: '', text: '' };

  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => page.waitForTimeout(2000));

  return page.evaluate(() => {
    (['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'] as string[]).forEach(
      (tag) => document.querySelectorAll(tag).forEach((el) => el.remove()),
    );

    // 제목 추출: og:title > h1/board-title > <title>
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content?.trim();
    const h1 = document.querySelector<HTMLElement>('h1, .board-title, .view-title, .bbs-title, .article-title')?.innerText?.trim();
    const docTitle = document.title?.trim();
    const rawTitle = ogTitle || h1 || docTitle || '';

    // 본문 텍스트 추출
    const contentSelectors = [
      'article', 'main', '.board-view', '.view-body', '.article-body',
      '.content-body', '.news-body', '#article-view-content-div',
      '.bbs_view', '.view_cont', '.cont_area', '#content', '.news_view',
    ];
    let text = '';
    for (const sel of contentSelectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el) {
        const t = el.innerText?.trim();
        if (t && t.length > 100) { text = t; break; }
      }
    }
    if (!text) text = document.body?.innerText ?? '';

    return { title: rawTitle, text };
  });
}

// ─── 텍스트 사전필터 (AI 호출 전) ─────────────────────────────────────────────
function passesTextPreFilter(text: string, url: string): boolean {
  const hasFutureYear = /202[6-9]|20[3-9]\d/.test(text); // 2030-2099 커버
  const hasKeyword = EVENT_KEYWORDS.some((kw) => text.includes(kw));
  if (!hasFutureYear && !hasKeyword) {
    console.log(`[PRE-FILTER] Skip: ${url.slice(0, 80)}`);
    skippedByPreFilter++;
    return false;
  }
  return true;
}

// ─── 스크래핑 + DB 저장 ────────────────────────────────────────────────────────
async function scrapeAndSave(page: import('playwright').Page, url: string): Promise<void> {
  const canonicalUrl = normalizeUrl(url);
  processedCount++;
  console.log(`[SCRAPER] Processing: ${canonicalUrl}`);
  try {
    // 중복 체크
    const dup = await dbClient.query('SELECT id FROM "Event" WHERE "originUrl" = $1 LIMIT 1', [canonicalUrl]);
    if (dup.rowCount && dup.rowCount > 0) {
      console.log(`[SCRAPER] Skip (duplicate): ${canonicalUrl}`);
      return;
    }

    const { title: pageTitle, text } = await extractPageData(page, url);
    const koreanChars = (text.match(/[가-힣]/g) || []).length;

    let finalTitle: string;
    let finalDate: string;
    let finalLocation: string;
    let finalCategory: string;
    let finalThemeColor: string;
    let finalSummary: string;

    if (koreanChars >= 50) {
      // ── 텍스트 사전필터 ──────────────────────────────────────────────────────
      if (!passesTextPreFilter(text, url)) return;

      // ── 규칙 기반 파싱 (AI 호출 없음) ────────────────────────────────────────
      const ruled = extractRuleBased(pageTitle, text);
      finalTitle = ruled.title;
      finalDate = ruled.date;
      finalLocation = ruled.location;
      finalCategory = ruled.category;
      finalThemeColor = ruled.themeColor;

      // 제목이 너무 짧거나 없으면 스킵
      if (finalTitle.length < 4) {
        console.log(`[SCRAPER] Skip (no title): ${canonicalUrl}`);
        return;
      }

      // 과거 이벤트 조기 스킵 (AI 호출 없이)
      if (!finalDate.startsWith('1970')) {
        const eventDate = new Date(finalDate);
        if (eventDate < TWO_DAYS_AGO) {
          console.log(`[SCRAPER] Skip (past event ${finalDate}): ${canonicalUrl}`);
          return;
        }
      }

      // 날짜+장소 모두 미정 → 저장 가치 없음
      if (finalDate.startsWith('1970') && finalLocation === '장소 미정') {
        console.log(`[SCRAPER] Skip (no event data): ${canonicalUrl}`);
        return;
      }

      // ── AI: 요약만 생성 (입력 ~280토큰, 이전 대비 78% 절감) ─────────────────
      finalSummary = await generateSummary(finalTitle, text);

    } else {
      // ── Vision 폴백 (한국어 텍스트 부족 시) ─────────────────────────────────
      const imageUrls = await extractImageUrls(page);
      if (imageUrls.length === 0) {
        console.log(`[SCRAPER] Skip (Korean chars: ${koreanChars}, no images): ${url}`);
        return;
      }
      console.log(`[VISION] Korean chars too few (${koreanChars}), trying images`);
      let visionResult: Awaited<ReturnType<typeof refineWithVision>> = null;
      for (const imgUrl of imageUrls.slice(0, 3)) {
        const imageData = await fetchImageAsBase64(imgUrl);
        if (!imageData) continue;
        console.log(`[VISION] Analyzing: ${imgUrl.slice(0, 80)}`);
        visionResult = await refineWithVision(imageData);
        if (visionResult) break;
      }
      if (!visionResult) {
        console.log(`[SCRAPER] Skip (Vision no result): ${url}`);
        return;
      }
      finalTitle = visionResult.title;
      finalDate = visionResult.date;
      finalLocation = visionResult.location;
      finalCategory = visionResult.category;
      finalThemeColor = visionResult.themeColor;
      finalSummary = visionResult.aiSummary || '';
    }

    // 카테고리 유효성 보장
    const validCategories = ['피정', '강론', '강의', '특강', '피정의집', '순례', '청년', '문화', '선교', '미사'];
    const category = validCategories.includes(finalCategory) ? finalCategory : '선교';

    const isUnknownDate = finalDate.startsWith('1970');

    await dbClient.query(
      `INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', NOW(), NOW())`,
      [
        crypto.randomUUID(),
        finalTitle,
        isUnknownDate ? null : new Date(finalDate),
        finalLocation,
        finalSummary,
        finalThemeColor,
        canonicalUrl,
        category,
      ],
    );
    savedCount++;
    console.log(`[SCRAPER] ✅ Saved: ${finalTitle} [${category}]`);
  } catch (err) {
    console.error(`[SCRAPER] Error: ${url}:`, (err as Error).message);
  }
}

// ─── 소스 목록 ────────────────────────────────────────────────────────────────
const SOURCES: Source[] = [
  {
    name: '굿뉴스 행사공지',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4777',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4777'),
    maxItems: 20,
  },
  {
    name: '굿뉴스 이벤트',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4785',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4785'),
    maxItems: 15,
  },
  {
    name: '굿뉴스 선교게시판',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4783',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4783'),
    maxItems: 15,
  },
  {
    name: '굿뉴스 피정',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4780',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4780'),
    maxItems: 20,
    bypassTitleFilter: true,
  },
  {
    name: '굿뉴스 성지순례',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4782',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4782'),
    maxItems: 15,
    bypassTitleFilter: true,
  },
  {
    name: '굿뉴스 청년/성소',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4784',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4784'),
    maxItems: 15,
    bypassTitleFilter: true,
  },
  {
    name: '굿뉴스 성소안내',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4786',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4786'),
    maxItems: 10,
    bypassTitleFilter: true,
  },
  {
    name: '굿뉴스 특강/세미나',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4788',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4788'),
    maxItems: 15,
    bypassTitleFilter: true,
  },
  {
    name: 'CBCK 소식',
    listUrl: 'https://www.cbck.or.kr/Notice?gb=K1200',
    linkFilter: (h) => /cbck\.or\.kr\/Notice\/\d{7,}/.test(h),
    maxItems: 12,
  },
  {
    name: 'CBCK 보도자료',
    listUrl: 'https://www.cbck.or.kr/Notice?gb=K1300',
    linkFilter: (h) => /cbck\.or\.kr\/Notice\/\d{7,}/.test(h),
    maxItems: 10,
  },
  {
    name: '광주대교구 행사',
    listUrl: 'https://www.gjcatholic.or.kr/nota/event',
    linkFilter: (h) =>
      /(?:youth|samog|vocatio|cateb)\.gjcatholic\.or\.kr\/(?:picture|leaflet|board)\/\d+/.test(h),
    maxItems: 10,
    waitSelector: '.board-list, ul.list, .event-list, table',
    bypassTitleFilter: true,
  },
  {
    name: '대전교구 행사공지',
    listUrl: 'https://www.djcatholic.or.kr/home/news/monthplan.php',
    linkFilter: (h) => h.includes('djcatholic.or.kr') && h.includes('enter=v') && h.includes('idx='),
    maxItems: 8,
    waitSelector: '.board, table, .list, tbody',
  },
];

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  if (!anthropic) console.warn('[WARN] ANTHROPIC_API_KEY not set — summaries will be empty.');

  console.log('[DB] Connecting...');
  dbClient = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await dbClient.connect();
  console.log('[DB] Connected.');

  // DB 정리
  const cleanedDummy = await dbClient.query(
    `DELETE FROM "Event" WHERE (location = '장소 미정' OR location IS NULL) AND date < '1971-01-01'`,
  );
  if ((cleanedDummy.rowCount ?? 0) > 0) console.log(`[CLEANUP] 더미 ${cleanedDummy.rowCount}개 제거`);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cleanedExpired = await dbClient.query(
    `DELETE FROM "Event" WHERE date IS NOT NULL AND date < $1`, [twoDaysAgo],
  );
  if ((cleanedExpired.rowCount ?? 0) > 0) console.log(`[CLEANUP] 만료 ${cleanedExpired.rowCount}개 삭제`);

  const cleanedDups = await dbClient.query(`
    DELETE FROM "Event" WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY REGEXP_REPLACE("originUrl", '[?&]num=\\d+', '')
          ORDER BY "createdAt" DESC
        ) AS rn FROM "Event" WHERE "originUrl" LIKE '%bbs.catholic.or.kr%'
      ) ranked WHERE rn > 1
    )
  `);
  if ((cleanedDups.rowCount ?? 0) > 0) console.log(`[CLEANUP] BBS 중복 ${cleanedDups.rowCount}개 제거`);

  console.log('[BROWSER] Launching Chromium...');
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const sourceStats: Record<string, { processed: number; saved: number }> = {};

    for (const source of SOURCES) {
      console.log(`\n━━━ ${source.name} ━━━`);
      const processedBefore = processedCount;
      const savedBefore = savedCount;

      const context = await browser.newContext({
        locale: 'ko-KR',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();
      await page.route('**/*', (route) => {
        BLOCKED_RESOURCE_TYPES.has(route.request().resourceType()) ? route.abort() : route.continue();
      });

      const links = await extractLinks(page, source);
      for (const url of links) {
        await scrapeAndSave(page, url);
        await page.waitForTimeout(1000);
      }
      await context.close();

      sourceStats[source.name] = {
        processed: processedCount - processedBefore,
        saved: savedCount - savedBefore,
      };
      console.log(`[STAT] ${source.name}: 시도 ${processedCount - processedBefore}건 → 저장 ${savedCount - savedBefore}건`);
    }

    console.log('\n━━━ 소스별 결과 요약 ━━━');
    for (const [name, stat] of Object.entries(sourceStats)) {
      const emoji = stat.saved > 0 ? '✅' : stat.processed > 0 ? '⚪' : '❌';
      console.log(`${emoji} ${name}: ${stat.saved}/${stat.processed}`);
    }
  } finally {
    await browser.close();
    console.log('[BROWSER] Closed.');
  }

  console.log(`\n[SCRAPER] 완료. 시도: ${processedCount}, 저장: ${savedCount}`);
  console.log(`[COST]    AI 호출: ${aiCallCount}건, 사전필터 절감: ${skippedByPreFilter}건`);

  if (processedCount === 0) {
    throw new Error('[ALERT] No URLs processed — source site structures may have changed!');
  }
  if (savedCount === 0) {
    console.warn('[WARN] 0 new events saved (duplicates or past events). Normal if DB is up to date.');
  }

  if (savedCount > 0) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://amenguide-git-775250805671.us-west1.run.app';
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret) {
      try {
        const res = await fetch(`${frontendUrl}/api/revalidate`, {
          method: 'POST',
          headers: { 'x-revalidate-secret': revalidateSecret },
        });
        console.log(`[REVALIDATE] 완료 (status: ${res.status})`);
      } catch (err) {
        console.warn('[REVALIDATE] 실패 (비치명적):', (err as Error).message);
      }
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await dbClient?.end(); });
