import { chromium } from 'playwright';
import { Client } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

interface ScrapingResult {
  title: string;
  date: string;
  location: string;
  aiSummary: string;
  themeColor: string;
  category: string;
}

interface Source {
  name: string;
  listUrl: string;
  linkFilter: (href: string) => boolean;
  maxItems: number;
  waitSelector?: string;
}

interface LinkWithTitle {
  href: string;
  title: string;
}

let dbClient: Client;
let savedCount = 0;
let processedCount = 0;
let skippedByPreFilter = 0; // 사전필터로 절약된 AI 호출 수

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── 리소스 차단 ───────────────────────────────────────────────────────────────
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font', 'stylesheet']);

// ─── 행사 관련 키워드 (사전 필터용) ───────────────────────────────────────────
// 이 키워드가 제목/본문에 없으면 AI 호출 없이 스킵 → API 비용 절감
const EVENT_KEYWORDS = [
  '피정', '강의', '강좌', '특강', '행사', '모집', '신청', '순례',
  '성경공부', '세미나', '기도회', '미사', '음악회', '공연', '축제',
  '청년', '성령', '영성', '봉사', '레지오', '교육', '안내', '캠프',
  '수련', '연수', '피정의집', '수도원', '체험', '성지', '선교',
  '전례', '묵상', '기도', '강연', '심포지엄', '성가', '합창',
];

// ─── URL 정규화 ────────────────────────────────────────────────────────────────
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'bbs.catholic.or.kr') {
      u.searchParams.delete('num');
    }
    return u.toString();
  } catch {
    return url;
  }
}

// ─── 과거 이벤트 필터 ─────────────────────────────────────────────────────────
const TWO_DAYS_AGO = new Date();
TWO_DAYS_AGO.setDate(TWO_DAYS_AGO.getDate() - 2);

// ─── AI 프롬프트 ──────────────────────────────────────────────────────────────
function buildAiPrompt(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are a Korean Catholic event analyst. Today is ${today}.
Extract event details from the input.

IMPORTANT DATE DISTINCTION:
- "event_date" = the date the EVENT ITSELF takes place (this is what matters for skip decision)
- "publication_date" = when the notice was posted (IGNORE this for skip decisions)
- Example: A notice posted 3 months ago about an upcoming retreat SHOULD be extracted.

SKIP and return {"skip": true} ONLY if:
- The event_date (not publication date) is more than 1 month before today (${today})
- It is purely an internal administrative/committee meeting with no public participation
- It is a news report about a COMPLETED event with no upcoming schedule info
- There is no actual event at all (editorial, petition, obituary, etc.)

Otherwise return ONLY valid JSON (no markdown fences):
- title (string): Official event name in Korean
- date (string): ISO 8601 date of the EVENT e.g. "2026-05-20T10:00:00". Use "1970-01-01T00:00:00" if unknown.
- location (string): Venue name and city in Korean. Use "장소 미정" if unknown.
- aiSummary (string): 2-3 Korean sentences, warm spiritual tone (은총이 가득한 따뜻한 어조)
- themeColor (string): One of #E63946 #457B9D #FFB703 #06D6A0 #C9A96E
- category (string): One of "피정" | "강론" | "강의" | "특강" | "피정의집" | "순례" | "청년" | "문화" | "선교" | "미사"
  피정=피정·묵상·영성수련·성령쇄신·관상기도
  강론=강론·설교·사목서한·강론집
  강의=강좌·성경공부·교리·세미나·교육
  특강=특강·초청강연·공개강좌·심포지엄
  피정의집=피정의집·수련원·영성원·수도원프로그램·봉쇄피정
  순례=성지순례·도보순례·성당탐방·순례길
  청년=청년·청소년·Youth·성소·대학생
  문화=음악회·공연·전시·합창·연극·콘서트·뮤지컬·축제
  선교=선교·봉사·레지오·복음화·사회사목·자선
  미사=미사·전례·기도회·연도·성체·위령`;
}

// ─── 소스 목록 (검증된 소스만 유지) ──────────────────────────────────────────
// Phase 2/3 소스는 linkFilter 패턴 불일치로 0건 반환 → 제거하여 불필요한 실행 비용 절감
const SOURCES: Source[] = [
  // ── 굿뉴스 BBS (한국 천주교 공식 게시판) — 검증된 소스 ────────────────────
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
  },
  {
    name: '굿뉴스 성지순례',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4782',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4782'),
    maxItems: 15,
  },
  {
    name: '굿뉴스 청년/성소',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4784',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4784'),
    maxItems: 15,
  },
  {
    name: '굿뉴스 성소안내',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4786',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4786'),
    maxItems: 10,
  },
  {
    name: '굿뉴스 특강/세미나',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4788',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4788'),
    maxItems: 15,
  },
  // ── CBCK 한국 천주교 주교회의 ──────────────────────────────────────────────
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
  // ── 교구 (검증된 소스) ─────────────────────────────────────────────────────
  {
    name: '광주대교구 행사',
    listUrl: 'https://www.gjcatholic.or.kr/nota/event',
    linkFilter: (h) =>
      /gjcatholic\.or\.kr\/nota\/event\/\d+/.test(h),
    maxItems: 10,
    waitSelector: '.board-list, ul.list, .event-list, table',
  },
  {
    name: '대전교구 행사공지',
    listUrl: 'http://www.djcatholic.or.kr/home/news/monthplan.php',
    linkFilter: (h) =>
      h.includes('djcatholic.or.kr') &&
      h.includes('enter=v') &&
      h.includes('idx='),
    maxItems: 8,
    waitSelector: '.board, table, .list, tbody',
  },
];

// ─── AI 텍스트 정제 ───────────────────────────────────────────────────────────
async function refineWithAi(text: string): Promise<ScrapingResult | null> {
  if (!anthropic) return null;

  // 입력 토큰 절감: 3500자로 제한 (이전 6000자)
  // 행사 정보는 보통 첫 2000자 안에 있음
  const content = text.slice(0, 3500);
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400, // 512→400: 구조화된 JSON 응답에 충분
    system: buildAiPrompt(),
    messages: [{ role: 'user', content: `페이지 내용:\n\n${content}` }],
  });

  const block = message.content[0];
  if (block.type !== 'text') return null;
  return parseAiResponse(block.text);
}

// ─── AI Vision 정제 (포스터 이미지) ──────────────────────────────────────────
async function refineWithVision(imageData: { data: string; mimeType: string }): Promise<ScrapingResult | null> {
  if (!anthropic) return null;

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
  type ValidMime = (typeof validMimeTypes)[number];
  const mimeType = validMimeTypes.includes(imageData.mimeType as ValidMime)
    ? (imageData.mimeType as ValidMime)
    : ('image/jpeg' as ValidMime);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: buildAiPrompt(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: imageData.data },
          },
          { type: 'text', text: '이 이미지는 가톨릭 행사 포스터입니다. 행사 정보를 추출해주세요.' },
        ],
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') return null;
  return parseAiResponse(block.text);
}

// ─── JSON 파싱 공통 ───────────────────────────────────────────────────────────
function parseAiResponse(raw: string): ScrapingResult | null {
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.skip) return null;
    return parsed as ScrapingResult;
  } catch {
    console.error('[AI] JSON parse failed:', cleaned.slice(0, 100));
    return null;
  }
}

// ─── 이미지 src 추출 ──────────────────────────────────────────────────────────
async function extractImageUrls(page: import('playwright').Page): Promise<string[]> {
  return page.evaluate(() => {
    const SKIP_PATTERNS = ['icon', 'logo', 'banner_small', 'btn_', 'arrow', 'bullet', 'bg_'];
    return Array.from(document.querySelectorAll('img[src]'))
      .map((img) => (img as HTMLImageElement).src)
      .filter((src) => {
        if (!src || (!src.startsWith('http') && !src.startsWith('//'))) return false;
        const lower = src.toLowerCase();
        return !SKIP_PATTERNS.some((p) => lower.includes(p));
      });
  });
}

// ─── 이미지 다운로드 → base64 ─────────────────────────────────────────────────
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    if (!mimeType.startsWith('image/')) return null;

    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString('base64');
    if (data.length > 6_000_000) {
      console.log(`[VISION] Image too large (${Math.round(data.length / 1024)}KB base64), skipping`);
      return null;
    }
    return { data, mimeType };
  } catch (err) {
    console.warn(`[VISION] Fetch failed: ${url}`, (err as Error).message);
    return null;
  }
}

// ─── 페이지 이동 (재시도 포함) ────────────────────────────────────────────────
async function gotoWithRetry(
  page: import('playwright').Page,
  url: string,
  retries = 2,
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return true;
    } catch (err) {
      if (attempt === retries) {
        console.error(`[NAV] Failed after ${retries + 1} attempts: ${url}`, (err as Error).message);
        return false;
      }
      console.warn(`[NAV] Retry ${attempt + 1}/${retries}: ${url}`);
      await page.waitForTimeout(2000 * (attempt + 1));
    }
  }
  return false;
}

// ─── 리스트 페이지에서 링크+제목 추출 → 제목 사전필터 적용 ─────────────────
// 핵심 비용절감: 행사 키워드 없는 링크는 방문하지 않음 (AI 호출 없음)
async function extractLinks(
  page: import('playwright').Page,
  source: Source,
): Promise<string[]> {
  try {
    console.log(`[LIST] ${source.name}: ${source.listUrl}`);
    const ok = await gotoWithRetry(page, source.listUrl);
    if (!ok) return [];

    if (source.waitSelector) {
      try {
        await page.waitForSelector(source.waitSelector, { timeout: 5000 });
      } catch {
        await page.waitForTimeout(2000);
      }
    } else {
      await page.waitForTimeout(2500);
    }

    // 링크 + 제목 텍스트 함께 추출
    const linksWithTitles: LinkWithTitle[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => ({
          href: (a as HTMLAnchorElement).href,
          title: a.textContent?.trim().replace(/\s+/g, ' ') || '',
        }))
        .filter(({ href }) => !!href),
    );

    // 1단계: linkFilter로 관련 URL만 추출
    const matchedLinks = linksWithTitles.filter(({ href }) => source.linkFilter(href));

    // 2단계: 제목 키워드 사전필터 (제목이 4자 이상일 때만 적용)
    // 제목 없거나 짧으면 일단 포함 (방문해서 본문 확인)
    const preFiltered = matchedLinks.filter(({ title }) => {
      if (title.length < 4) return true; // 제목 없음 → 일단 방문
      return EVENT_KEYWORDS.some((kw) => title.includes(kw));
    });

    // 중복 제거 + maxItems 제한
    const unique = [...new Set(preFiltered.map((l) => l.href))].slice(0, source.maxItems);

    const skipped = matchedLinks.length - preFiltered.length;
    if (skipped > 0) {
      console.log(`[LIST] ${source.name}: 제목 필터로 ${skipped}건 사전 제외 (API 절감)`);
    }
    console.log(`[LIST] Found ${unique.length} URLs (total matched: ${matchedLinks.length})`);
    return unique;
  } catch (err) {
    console.error(`[LIST] ${source.name} error:`, (err as Error).message);
    return [];
  }
}

// ─── 페이지 텍스트 추출 ───────────────────────────────────────────────────────
async function extractText(page: import('playwright').Page, url: string): Promise<string> {
  const ok = await gotoWithRetry(page, url);
  if (!ok) return '';

  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {
    await page.waitForTimeout(2000);
  }

  return page.evaluate(() => {
    (['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'] as string[]).forEach(
      (tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
      },
    );

    const contentSelectors = [
      'article', 'main', '.board-view', '.view-body', '.article-body',
      '.content-body', '.news-body', '#article-view-content-div',
      '.bbs_view', '.view_cont', '.cont_area', '#content', '.news_view',
    ];

    for (const sel of contentSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length > 100) return text;
      }
    }

    return document.body?.innerText ?? '';
  });
}

// ─── 텍스트 사전필터 (AI 호출 전) ─────────────────────────────────────────────
// 미래 연도 + 행사 키워드 둘 다 없으면 AI 호출 없이 스킵
function passesTextPreFilter(text: string, url: string): boolean {
  // 미래 연도 패턴 (2026~2030)
  const hasFutureYear = /202[6-9]|2030/.test(text);
  // 행사 관련 키워드
  const hasEventKeyword = EVENT_KEYWORDS.some((kw) => text.includes(kw));

  if (!hasFutureYear && !hasEventKeyword) {
    console.log(`[PRE-FILTER] Skip (no event indicators): ${url.slice(0, 80)}`);
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
    // 중복 체크 (AI 호출 전)
    const dup = await dbClient.query(
      'SELECT id FROM "Event" WHERE "originUrl" = $1 LIMIT 1',
      [canonicalUrl],
    );
    if (dup.rowCount && dup.rowCount > 0) {
      console.log(`[SCRAPER] Skip (duplicate): ${canonicalUrl}`);
      return;
    }

    const text = await extractText(page, url);
    const koreanChars = (text.match(/[가-힣]/g) || []).length;

    let result: ScrapingResult | null = null;

    if (koreanChars >= 50) {
      // 텍스트 사전필터: 미래 연도 + 키워드 없으면 AI 호출 스킵
      if (!passesTextPreFilter(text, url)) return;

      result = await refineWithAi(text);
    } else {
      // Vision fallback (포스터 이미지)
      const imageUrls = await extractImageUrls(page);
      if (imageUrls.length > 0) {
        console.log(`[VISION] Korean chars too few (${koreanChars}), trying ${imageUrls.length} image(s)`);
        for (const imgUrl of imageUrls.slice(0, 3)) {
          const imageData = await fetchImageAsBase64(imgUrl);
          if (!imageData) continue;
          console.log(`[VISION] Analyzing image: ${imgUrl.slice(0, 80)}`);
          result = await refineWithVision(imageData);
          if (result) break;
        }
      }
      if (!result) {
        console.log(`[SCRAPER] Skip (Korean chars: ${koreanChars}, no usable images): ${url}`);
        return;
      }
    }

    if (!result) {
      console.log(`[SCRAPER] Skip (AI filtered): ${url}`);
      return;
    }

    const isUnknownDate = result.date.startsWith('1970');

    if (isUnknownDate && result.location === '장소 미정') {
      console.log(`[SCRAPER] Skip (no event data): ${canonicalUrl}`);
      return;
    }

    if (!isUnknownDate) {
      const eventDate = new Date(result.date);
      if (eventDate < TWO_DAYS_AGO) {
        console.log(`[SCRAPER] Skip (past event ${result.date}): ${canonicalUrl}`);
        return;
      }
    }

    const validCategories = ['피정', '강론', '강의', '특강', '피정의집', '순례', '청년', '문화', '선교', '미사'];
    const category = validCategories.includes(result.category) ? result.category : '선교';

    await dbClient.query(
      `INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', NOW(), NOW())`,
      [
        crypto.randomUUID(),
        result.title,
        isUnknownDate ? null : new Date(result.date),
        result.location,
        result.aiSummary,
        result.themeColor,
        canonicalUrl,
        category,
      ],
    );
    savedCount++;
    console.log(`[SCRAPER] ✅ Saved: ${result.title} [${category}] (${result.location})`);
  } catch (err) {
    console.error(`[SCRAPER] Error: ${url}:`, (err as Error).message);
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  if (!anthropic) console.warn('[WARN] ANTHROPIC_API_KEY not set — no events will be saved.');

  console.log('[DB] Connecting...');
  dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await dbClient.connect();
  console.log('[DB] Connected.');

  // ── DB 정리 ────────────────────────────────────────────────────────────────
  const cleanedDummy = await dbClient.query(
    `DELETE FROM "Event" WHERE (location = '장소 미정' OR location IS NULL) AND date < '1971-01-01'`,
  );
  if ((cleanedDummy.rowCount ?? 0) > 0)
    console.log(`[CLEANUP] 더미 레코드 ${cleanedDummy.rowCount}개 제거.`);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cleanedExpired = await dbClient.query(
    `DELETE FROM "Event" WHERE date IS NOT NULL AND date < $1`,
    [twoDaysAgo],
  );
  if ((cleanedExpired.rowCount ?? 0) > 0)
    console.log(`[CLEANUP] 종료 2일 지난 이벤트 ${cleanedExpired.rowCount}개 삭제.`);

  const cleanedDups = await dbClient.query(`
    DELETE FROM "Event"
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY REGEXP_REPLACE("originUrl", '[?&]num=\\d+', '')
                 ORDER BY "createdAt" DESC
               ) AS rn
        FROM "Event"
        WHERE "originUrl" LIKE '%bbs.catholic.or.kr%'
      ) ranked
      WHERE rn > 1
    )
  `);
  if ((cleanedDups.rowCount ?? 0) > 0)
    console.log(`[CLEANUP] BBS 중복 이벤트 ${cleanedDups.rowCount}개 제거.`);

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
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      await page.route('**/*', (route) => {
        if (BLOCKED_RESOURCE_TYPES.has(route.request().resourceType())) {
          route.abort();
        } else {
          route.continue();
        }
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

  console.log(`\n[SCRAPER] 완료. 시도: ${processedCount}, 저장: ${savedCount}, 사전필터 절감: ${skippedByPreFilter}건`);

  if (processedCount === 0) {
    throw new Error('[ALERT] No URLs processed — source site structures may have changed!');
  }
  if (savedCount === 0) {
    console.warn('[WARN] 0 new events saved this run (all duplicates or past events). Normal if DB is up to date.');
  }

  if (savedCount > 0) {
    const frontendUrl =
      process.env.FRONTEND_URL ?? 'https://amenguide-git-775250805671.us-west1.run.app';
    const revalidateSecret = process.env.REVALIDATE_SECRET;
    if (revalidateSecret) {
      try {
        const res = await fetch(`${frontendUrl}/api/revalidate`, {
          method: 'POST',
          headers: { 'x-revalidate-secret': revalidateSecret },
        });
        console.log(`[REVALIDATE] 프론트엔드 캐시 무효화 완료 (status: ${res.status})`);
      } catch (err) {
        console.warn('[REVALIDATE] 캐시 무효화 실패 (비치명적):', (err as Error).message);
      }
    } else {
      console.warn('[REVALIDATE] REVALIDATE_SECRET 미설정 — 캐시 무효화 건너뜀');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await dbClient?.end();
  });
