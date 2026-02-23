import { Client } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { convert } from 'html-to-text';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

interface ScrapingResult {
  title: string;
  date: string;
  location: string;
  aiSummary: string;
  themeColor: string;
}

let dbClient: Client;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// ─── AI 정제 ─────────────────────────────────────────────────────────────────
async function refineWithAi(text: string, rawHtml?: string): Promise<ScrapingResult> {
  if (!anthropic) {
    console.log('[AI] No API key. Using HTML title fallback.');
    let titleFallback = '은총의 초대';
    if (rawHtml) {
      const m = rawHtml.match(/<title>([^<]*)<\/title>/i);
      if (m?.[1]) titleFallback = m[1].trim().replace(/\s*[-|]\s*.*$/, ''); // 사이트명 제거
    }
    return {
      title: titleFallback,
      date: new Date().toISOString(),
      location: '장소 정보 없음',
      aiSummary: '이 행사에 대한 정보가 곧 업데이트될 예정입니다. 주님의 은총 속에서 평화로운 하루 되세요.',
      themeColor: '#C9A96E',
    };
  }

  const contentForAi = text.slice(0, 8000);
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `You are an elite Catholic event data analyst.
Extract event details from Korean Catholic webpage content into JSON.
Return ONLY valid JSON (no markdown fences):
- title (string): Clean, official event name in Korean.
- date (ISO 8601 string): e.g. 2026-05-20T10:00:00. If unknown, use "1970-01-01T00:00:00".
- location (string): Name of the church/venue and city in Korean. If unknown, use "장소 정보 없음".
- aiSummary (Korean, 2-3 sentences): Warm, spiritually grace-filled tone (은총이 가득하고 따뜻한 어조).
- themeColor (Hex): #E63946 Ruby, #457B9D Sapphire, #FFB703 Amber, #06D6A0 Emerald, #C9A96E Gold.`,
    messages: [
      { role: 'user', content: `Webpage content:\n\n${contentForAi}` },
    ],
  });

  const block = message.content[0];
  if (block.type !== 'text') throw new Error('AI returned no data.');
  const raw = block.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(raw) as ScrapingResult;
}

// ─── HTML 가져오기 ───────────────────────────────────────────────────────────
async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    timeout: 15000,
    responseType: 'arraybuffer',
  });

  // EUC-KR 인코딩 처리 (굿뉴스 사이트)
  const contentType: string = response.headers['content-type'] || '';
  if (contentType.includes('euc-kr') || contentType.includes('ks_c_5601')) {
    const iconv = await import('iconv-lite').catch(() => null);
    if (iconv) return iconv.decode(Buffer.from(response.data), 'euc-kr');
  }
  return Buffer.from(response.data).toString('utf-8');
}

// ─── 목록 페이지에서 개별 이벤트 URL 추출 ──────────────────────────────────
async function extractEventUrls(listUrl: string, baseUrl: string, linkPattern: RegExp): Promise<string[]> {
  try {
    console.log(`[LIST] Scanning: ${listUrl}`);
    const html = await fetchHtml(listUrl);
    const matches = [...html.matchAll(linkPattern)];
    const urls = [...new Set(
      matches.map(m => {
        const href = m[1];
        if (href.startsWith('http')) return href;
        return `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
      })
    )].slice(0, 5); // 최신 5개만
    console.log(`[LIST] Found ${urls.length} event URLs`);
    return urls;
  } catch (e) {
    console.error(`[LIST] Failed to scan ${listUrl}:`, (e as Error).message);
    return [];
  }
}

// ─── 개별 URL 스크래핑 + DB 저장 ────────────────────────────────────────────
async function scrapeUrl(url: string) {
  console.log(`[SCRAPER] Processing: ${url}`);
  try {
    const rawHtml = await fetchHtml(url);
    const bodyText = convert(rawHtml, {
      wordwrap: 130,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
        { selector: 'nav', format: 'skip' },
        { selector: 'header', format: 'skip' },
        { selector: 'footer', format: 'skip' },
        { selector: 'script', format: 'skip' },
        { selector: 'style', format: 'skip' },
      ],
    });

    const result = await refineWithAi(bodyText, rawHtml);

    // 중복 체크
    const existing = await dbClient.query(
      'SELECT id FROM "Event" WHERE "originUrl" = $1 LIMIT 1',
      [url],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      console.log(`[SCRAPER] Skip (duplicate): ${url}`);
      return;
    }

    // location이 없거나 날짜가 epoch(1970)인 경우 — AI가 이벤트를 못 찾은 것
    if (result.location === '장소 정보 없음' && result.date.startsWith('1970')) {
      console.log(`[SCRAPER] Skip (no event data extracted): ${url}`);
      return;
    }

    await dbClient.query(
      `INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        crypto.randomUUID(),          // ← UUID (수정됨)
        result.title,
        new Date(result.date),
        result.location,
        result.aiSummary,
        result.themeColor,
        url,
        '기타',
      ],
    );
    console.log(`[SCRAPER] ✅ Saved: ${result.title} (${result.location})`);
  } catch (err) {
    console.error(`[SCRAPER] Error processing ${url}:`, (err as Error).message);
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  if (!openai) console.warn('[WARN] OPENAI_API_KEY not set — AI fallback mode (poor quality data).');

  console.log('[SCRAPER] Connecting to DB...');
  console.log('[SCRAPER] DB host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] ?? 'unknown');

  dbClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await dbClient.connect();

  // ── 오염된 데이터 정리 (장소 없음 + epoch 날짜 + 짧은 ID) ────────────────
  console.log('[CLEANUP] Removing low-quality records...');
  const cleaned = await dbClient.query(
    `DELETE FROM "Event"
     WHERE (location = '장소 정보 없음' OR location IS NULL)
       AND (date < '1971-01-01' OR date >= NOW() - INTERVAL '1 day')
       AND LENGTH(id) < 20`,   // UUID는 36자, 짧은 건 이전 랜덤 ID
  );
  console.log(`[CLEANUP] Removed ${cleaned.rowCount} record(s).`);

  // ── 타겟 소스 정의 ────────────────────────────────────────────────────────
  // 방식 A: 굿뉴스 피정 게시판 목록 → 개별 URL 자동 추출
  const goodNewsBase = 'https://bbs.catholic.or.kr';
  const retreatListUrl = 'https://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=re';
  const retreatLinkPattern = /href="(\/bbs\/bbs_view\.asp\?menu=re[^"]+)"/gi;

  const listUrls = await extractEventUrls(retreatListUrl, goodNewsBase, retreatLinkPattern);

  // 방식 B: 알려진 고정 이벤트 URL (목록에서 추출 실패 시 보조)
  const directUrls: string[] = [
    // 실제 이벤트 페이지 URL을 여기에 추가
    // 예: 'https://www.dominus.or.kr/program/...',
  ];

  const allTargets = [...new Set([...listUrls, ...directUrls])];

  if (allTargets.length === 0) {
    console.log('[SCRAPER] No target URLs found. Exiting.');
    return;
  }

  for (const url of allTargets) {
    await scrapeUrl(url);
    await new Promise(r => setTimeout(r, 1500)); // 사이트 부하 방지
  }

  console.log('[SCRAPER] Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await dbClient?.end(); });
