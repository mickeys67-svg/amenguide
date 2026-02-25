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
  waitSelector?: string; // Optional CSS selector to wait for before extracting links
}

let dbClient: Client;
let savedCount = 0;
let processedCount = 0; // 중복·과거 제외 전 시도 수

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── 리소스 차단 (이미지/폰트/미디어/스타일시트) ─────────────────────────────
// Globally best practice: block non-essential resources to speed up scraping 50-80%
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font', 'stylesheet']);

// ─── URL 정규화 ────────────────────────────────────────────────────────────────
// 굿뉴스 BBS: "num=" 파라미터는 목록 순번으로, 새 글이 올라올 때마다 밀려서
// 동일 게시글이 다른 URL로 인식되어 중복 저장됨 → num= 제거 후 저장
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'bbs.catholic.or.kr') {
      u.searchParams.delete('num'); // 순번 파라미터 제거
    }
    return u.toString();
  } catch {
    return url;
  }
}

// ─── 과거 이벤트 필터 ─────────────────────────────────────────────────────────
// 1년 전 이전 날짜로 저장된 이벤트는 지난 행사 — 수집 제외
const ONE_YEAR_AGO = new Date();
ONE_YEAR_AGO.setFullYear(ONE_YEAR_AGO.getFullYear() - 1);

// ─── AI 프롬프트 공통 시스템 메시지 ──────────────────────────────────────────
// 오늘 날짜를 포함하여 AI 가 과거/미래 구분을 명확히 할 수 있도록 함
function buildAiPrompt(): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `You are a Korean Catholic event analyst. Today is ${today}.
Extract event details from the input.
ONLY extract if this is a FUTURE or very recent (within 2 weeks past) Catholic event, retreat, lecture, pilgrimage, or program.
SKIP and return {"skip": true} if the content is:
- A past event older than 2 weeks from today
- An internal administrative meeting or committee session
- A news article about an already-completed event
- A press release without a specific upcoming event date
Otherwise return ONLY valid JSON (no markdown fences):
- title (string): Official event name in Korean
- date (string): ISO 8601 e.g. "2026-05-20T10:00:00". Use "1970-01-01T00:00:00" if unknown.
- location (string): Venue name and city in Korean. Use "장소 미정" if unknown.
- aiSummary (string): 2-3 Korean sentences, warm spiritual tone (은총이 가득한 따뜻한 어조)
- themeColor (string): One of #E63946 #457B9D #FFB703 #06D6A0 #C9A96E
- category (string): One of "피정" | "미사" | "강의" | "순례" | "청년" | "문화" | "선교"
  피정=피정·묵상·영성수련·성령쇄신, 미사=미사·전례·기도회·연도·강론, 강의=강좌·성경·교리·특강·세미나,
  순례=성지순례·도보순례·성당탐방, 청년=청년·청소년·Youth·성소,
  문화=음악회·공연·전시·합창·연극, 선교=선교·봉사·레지오·복음화·사회사목`;
}

// ─── 소스 목록 ────────────────────────────────────────────────────────────────
const SOURCES: Source[] = [
  // ── 굿뉴스 BBS (한국 천주교 공식 게시판) ──────────────────────────────────
  {
    name: '굿뉴스 행사공지',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4777',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4777'),
    maxItems: 8,
  },
  {
    name: '굿뉴스 이벤트',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4785',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4785'),
    maxItems: 8,
  },
  {
    name: '굿뉴스 선교게시판',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4783',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4783'),
    maxItems: 6,
  },
  // ── CBCK 한국 천주교 주교회의 ──────────────────────────────────────────────
  // ⚠️ CBCK /Events 는 내부 행정회의만 있어 제외.
  // 소식/보도자료는 공개 행사 안내 포함 가능 → 유지
  {
    name: 'CBCK 소식',
    listUrl: 'https://www.cbck.or.kr/Notice?gb=K1200',
    linkFilter: (h) => /cbck\.or\.kr\/Notice\/\d{7,}/.test(h),
    maxItems: 8,
  },
  {
    name: 'CBCK 보도자료',
    listUrl: 'https://www.cbck.or.kr/Notice?gb=K1300',
    linkFilter: (h) => /cbck\.or\.kr\/Notice\/\d{7,}/.test(h),
    maxItems: 5,
  },
  // ── 가톨릭 언론 ───────────────────────────────────────────────────────────
  {
    name: '가톨릭신문',
    listUrl: 'https://www.catholictimes.org/news/articleList.html?sc_section_code=S1N2',
    linkFilter: (h) => h.includes('articleView') && h.includes('catholictimes.org'),
    maxItems: 6,
  },
  {
    name: '평화방송 뉴스',
    listUrl: 'https://www.pbc.co.kr/CMS/news/sub_newslist.php?code=02_02',
    linkFilter: (h) => h.includes('pbc.co.kr') && h.includes('news_view'),
    maxItems: 6,
  },
  // ── 교구 사이트 ───────────────────────────────────────────────────────────
  {
    name: '대구대교구 일정',
    listUrl: 'https://daegu-archdiocese.or.kr/page/news.html?srl=schedule',
    linkFilter: (h) =>
      h.includes('daegu-archdiocese.or.kr') &&
      /view|news_view|idx=|no=|seq=/.test(h),
    maxItems: 10,
    waitSelector: '.calendar, .schedule, table',
  },
  {
    name: '광주대교구 행사',
    listUrl: 'https://www.gjcatholic.or.kr/nota/event',
    // 메인 도메인 + 서브도메인(youth/samog/vocatio) 모두 포함
    linkFilter: (h) =>
      /gjcatholic\.or\.kr\/nota\/event\/\d+/.test(h) ||
      /(?:youth|samog|vocatio|cateb)\.gjcatholic\.or\.kr\/(?:picture|leaflet|board)\/\d+/.test(h),
    maxItems: 10,
    waitSelector: '.board-list, ul.list, .event-list, table',
  },
  {
    name: '대전교구 행사공지',
    listUrl: 'http://www.djcatholic.or.kr/home/news/monthplan.php',
    // 실제 URL 패턴: /home/news/monthplan.php?enter=v&idx=XXXXX
    linkFilter: (h) =>
      h.includes('djcatholic.or.kr') &&
      h.includes('enter=v') &&
      h.includes('idx='),
    maxItems: 8,
    waitSelector: '.board, table, .list, tbody',
  },
  {
    name: '굿뉴스 피정',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4780',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4780'),
    maxItems: 8,
  },
];

// ─── AI 텍스트 정제 ───────────────────────────────────────────────────────────
async function refineWithAi(text: string): Promise<ScrapingResult | null> {
  if (!anthropic) return null;

  const content = text.slice(0, 6000);
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
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
    max_tokens: 512,
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

// ─── 이미지 src 추출 (DOM에서 — 차단해도 src 속성은 존재) ──────────────────────
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
    // Claude max image ~5MB encoded; skip anything larger
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
// Best practice: retry transient network failures (2 retries = 3 total attempts)
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
      await page.waitForTimeout(2000 * (attempt + 1)); // Exponential backoff
    }
  }
  return false;
}

// ─── 리스트 페이지에서 링크 추출 ─────────────────────────────────────────────
async function extractLinks(
  page: import('playwright').Page,
  source: Source,
): Promise<string[]> {
  try {
    console.log(`[LIST] ${source.name}: ${source.listUrl}`);
    const ok = await gotoWithRetry(page, source.listUrl);
    if (!ok) return [];

    // Best practice: use selector-based waiting when possible, fallback to timeout
    if (source.waitSelector) {
      try {
        await page.waitForSelector(source.waitSelector, { timeout: 5000 });
      } catch {
        await page.waitForTimeout(2000);
      }
    } else {
      // Allow JS to render board list
      await page.waitForTimeout(2500);
    }

    const hrefs: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => !!h),
    );

    const filtered = [...new Set(hrefs.filter(source.linkFilter))].slice(0, source.maxItems);
    console.log(`[LIST] Found ${filtered.length} URLs`);
    return filtered;
  } catch (err) {
    console.error(`[LIST] ${source.name} error:`, (err as Error).message);
    return [];
  }
}

// ─── 페이지 텍스트 추출 (핵심 콘텐츠 우선) ───────────────────────────────────
// Best practice: target specific content containers before falling back to body
async function extractText(page: import('playwright').Page, url: string): Promise<string> {
  const ok = await gotoWithRetry(page, url);
  if (!ok) return '';

  // Best practice: networkidle waits for all XHR/fetch to settle (JS-rendered content)
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {
    await page.waitForTimeout(2000); // Fallback for slow sites
  }

  return page.evaluate(() => {
    // Remove noise
    (['script', 'style', 'nav', 'header', 'footer', 'iframe', 'noscript'] as string[]).forEach(
      (tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
      },
    );

    // Best practice: target article/main content selectors specific to Korean Catholic sites
    const contentSelectors = [
      'article',
      'main',
      '.board-view',
      '.view-body',
      '.article-body',
      '.content-body',
      '.news-body',
      '#article-view-content-div', // catholictimes.org
      '.bbs_view',
      '.view_cont',
      '.cont_area',
      '#content',
      '.news_view',
    ];

    for (const sel of contentSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length > 100) return text;
      }
    }

    // Fallback: full body text
    return document.body?.innerText ?? '';
  });
}

// ─── 스크래핑 + DB 저장 ────────────────────────────────────────────────────────
async function scrapeAndSave(page: import('playwright').Page, url: string): Promise<void> {
  const canonicalUrl = normalizeUrl(url); // num= 등 순번 파라미터 제거
  processedCount++;
  console.log(`[SCRAPER] Processing: ${canonicalUrl}`);
  try {
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
      // Normal text-based extraction
      result = await refineWithAi(text);
    } else {
      // Fallback: try Vision on poster images
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

    // 1970 더미 날짜 → 날짜 불명 이벤트 (DB에 null로 저장)
    const isUnknownDate = result.date.startsWith('1970');

    if (isUnknownDate && result.location === '장소 미정') {
      // 날짜·장소 모두 미정 → 저장 가치 없음
      console.log(`[SCRAPER] Skip (no event data): ${canonicalUrl}`);
      return;
    }

    // 과거 이벤트 필터: 1년 전 이전 행사는 수집 제외 (날짜 불명 이벤트는 제외하지 않음)
    if (!isUnknownDate) {
      const eventDate = new Date(result.date);
      if (eventDate < ONE_YEAR_AGO) {
        console.log(`[SCRAPER] Skip (past event ${result.date}): ${canonicalUrl}`);
        return;
      }
    }

    const validCategories = ['피정', '미사', '강의', '순례', '청년', '문화', '선교'];
    const category = validCategories.includes(result.category) ? result.category : '선교';

    await dbClient.query(
      `INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        crypto.randomUUID(),
        result.title,
        isUnknownDate ? null : new Date(result.date), // 1970 더미 날짜는 null로 저장
        result.location,
        result.aiSummary,
        result.themeColor,
        canonicalUrl, // 정규화된 URL 저장
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

  // ── 정리 1: 날짜/장소 없는 더미 레코드 제거
  const cleanedDummy = await dbClient.query(
    `DELETE FROM "Event" WHERE (location = '장소 미정' OR location IS NULL) AND date < '1971-01-01'`,
  );
  if ((cleanedDummy.rowCount ?? 0) > 0)
    console.log(`[CLEANUP] 더미 레코드 ${cleanedDummy.rowCount}개 제거.`);

  // ── 정리 2: 행사 종료 2일 후 삭제 (만료 데이터 제거)
  // date IS NULL 인 날짜미정 이벤트는 제외 (보존)
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const cleanedExpired = await dbClient.query(
    `DELETE FROM "Event" WHERE date IS NOT NULL AND date < $1`,
    [twoDaysAgo],
  );
  if ((cleanedExpired.rowCount ?? 0) > 0)
    console.log(`[CLEANUP] 종료 2일 지난 이벤트 ${cleanedExpired.rowCount}개 삭제.`);

  // ── 정리 3: BBS num= 파라미터 기반 중복 제거
  // originUrl 에서 num= 제거 후 동일 URL 이 여러 건인 경우 최신 1건만 남김
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
    for (const source of SOURCES) {
      console.log(`\n━━━ ${source.name} ━━━`);
      const context = await browser.newContext({
        locale: 'ko-KR',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // Best practice: block non-essential resources (images, fonts, CSS, media)
      // Note: image src attributes are still in DOM even when blocked — used for Vision fallback
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
        await page.waitForTimeout(1000); // Respectful rate limiting
      }

      await context.close();
    }
  } finally {
    await browser.close();
    console.log('[BROWSER] Closed.');
  }

  console.log(`\n[SCRAPER] All done. Processed: ${processedCount}, Saved: ${savedCount}`);

  // ─── 0결과 모니터링 ──────────────────────────────────────────────────────
  // processedCount = 0 → 소스 사이트 구조 변경 의심 (실제 장애) → throw
  // processedCount > 0 but savedCount = 0 → 정상 (모두 중복 또는 과거 행사) → warn only
  if (processedCount === 0) {
    throw new Error('[ALERT] No URLs processed — source site structures may have changed!');
  }
  if (savedCount === 0) {
    console.warn('[WARN] 0 new events saved this run (all duplicates or past events). Normal if DB is up to date.');
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
