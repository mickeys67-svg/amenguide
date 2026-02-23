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

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── 리소스 차단 (이미지/폰트/미디어/스타일시트) ─────────────────────────────
// Globally best practice: block non-essential resources to speed up scraping 50-80%
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font', 'stylesheet']);

// ─── AI 프롬프트 공통 시스템 메시지 ──────────────────────────────────────────
const AI_SYSTEM_PROMPT = `You are a Korean Catholic event analyst. Extract event details from the input.
ONLY extract if this is a real Catholic event/retreat/program with a specific date and/or location.
If NOT a real upcoming event, return {"skip": true}.
Otherwise return ONLY valid JSON (no markdown fences):
- title (string): Official event name in Korean
- date (string): ISO 8601 e.g. "2026-05-20T10:00:00". Use "1970-01-01T00:00:00" if unknown.
- location (string): Venue name and city in Korean. Use "장소 미정" if unknown.
- aiSummary (string): 2-3 Korean sentences, warm spiritual tone (은총이 가득한 따뜻한 어조)
- themeColor (string): One of #E63946 #457B9D #FFB703 #06D6A0 #C9A96E
- category (string): One of "피정" | "강의" | "미사" | "성지순례" | "청년" | "기타"`;

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
    name: '굿뉴스 자유게시판',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4770',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4770'),
    maxItems: 5,
  },
  {
    name: '굿뉴스 교류게시판',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4778',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4778'),
    maxItems: 5,
  },
  {
    name: '굿뉴스 선교게시판',
    listUrl: 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=4783',
    linkFilter: (h) => h.includes('bbs_view.asp') && h.includes('menu=4783'),
    maxItems: 5,
  },
  // ── CBCK 한국 천주교 주교회의 ──────────────────────────────────────────────
  {
    name: 'CBCK 회의와 행사',
    listUrl: 'https://www.cbck.or.kr/Events',
    linkFilter: (h) => /cbck\.or\.kr\/(Events|Meeting|Notice)\/\d+/.test(h),
    maxItems: 8,
  },
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
];

// ─── AI 텍스트 정제 ───────────────────────────────────────────────────────────
async function refineWithAi(text: string): Promise<ScrapingResult | null> {
  if (!anthropic) return null;

  const content = text.slice(0, 6000);
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: AI_SYSTEM_PROMPT,
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
    system: AI_SYSTEM_PROMPT,
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
  console.log(`[SCRAPER] Processing: ${url}`);
  try {
    const dup = await dbClient.query(
      'SELECT id FROM "Event" WHERE "originUrl" = $1 LIMIT 1',
      [url],
    );
    if (dup.rowCount && dup.rowCount > 0) {
      console.log(`[SCRAPER] Skip (duplicate): ${url}`);
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

    if (result.date.startsWith('1970') && result.location === '장소 미정') {
      console.log(`[SCRAPER] Skip (no event data): ${url}`);
      return;
    }

    const category = result.category || '기타';

    await dbClient.query(
      `INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        crypto.randomUUID(),
        result.title,
        new Date(result.date),
        result.location,
        result.aiSummary,
        result.themeColor,
        url,
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

  const cleaned = await dbClient.query(
    `DELETE FROM "Event" WHERE (location = '장소 미정' OR location IS NULL) AND date < '1971-01-01' AND LENGTH(id) < 20`,
  );
  if ((cleaned.rowCount ?? 0) > 0) console.log(`[CLEANUP] Removed ${cleaned.rowCount} records.`);

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

  console.log(`\n[SCRAPER] All done. Total saved: ${savedCount}`);

  // ─── 0결과 모니터링: Actions가 실패로 감지 → 이메일 알림 ─────────────────
  if (savedCount === 0) {
    throw new Error('[ALERT] 0 events saved this run — site structures may have changed!');
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
