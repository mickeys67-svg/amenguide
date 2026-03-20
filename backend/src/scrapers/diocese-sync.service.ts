import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import { convert } from 'html-to-text';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { PrismaService } from '../prisma/prisma.service';

// ─── 내부 DTO ─────────────────────────────────────────────────────────────────
interface DioceseEvent {
  title: string;
  date: Date | null;
  location: string;
  originUrl: string | null;
  category: string;
  themeColor: string;
  aiSummary?: string | null;
  diocese?: string | null;
}

export interface DioceseSyncResult {
  busan: number;
  daegu: number;
  daejeon: number;
  seoul: number;
  suwon: number;
  incheon: number;
  gwangju: number;
  chuncheon: number;
  jeju: number;
  wonju: number;
  uijeongbu: number;
  cheongju: number;
  masan: number;
  andong: number;
  gunjong: number;
  cbck: number;
  total: number;
}

// ─── 카테고리 → 색상 매핑 (SANCTUS 디자인 시스템 — UI와 동일) ────────────────
const CATEGORY_COLOR: Record<string, string> = {
  피정: '#1B4080',    // deep blue
  강론: '#5C4033',    // 따뜻한 갈색 (설교·강론)
  강의: '#1A6B40',    // forest green
  특강: '#2D6A8A',    // steel blue (초청강연)
  피정의집: '#4A3060', // dark violet (수도원)
  미사: '#8B1A1A',    // deep crimson (전례색)
  순례: '#7B5230',    // warm brown
  청년: '#0B6B70',    // deep teal
  문화: '#6E2882',    // royal purple
  선교: '#C83A1E',    // vermillion
  뉴스: '#5C6B7A',    // muted slate blue (교구 소식)
};

@Injectable()
export class DioceseSyncService {
  private readonly logger = new Logger(DioceseSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── 전체 교구 순차 실행 ─────────────────────────────────────────────────
  async runAll(monthsAhead = 3): Promise<DioceseSyncResult> {
    this.logger.log(`[DioceseSync] 시작 — 앞으로 ${monthsAhead}개월 수집`);

    // ── 과거 행사 정리: 14일 이상 지난 이벤트 삭제 (events.service와 동일 기준) ──
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 14);
      cutoff.setHours(23, 59, 59, 999);
      const deleted = await this.prisma.event.deleteMany({
        where: { date: { lt: cutoff } },
      });
      if (deleted.count > 0) {
        this.logger.log(`[DioceseSync] 14일 이상 지난 행사 ${deleted.count}건 삭제`);
      }
    } catch (err) {
      this.logger.error(`[DioceseSync] 과거 행사 삭제 실패: ${(err as Error).message}`);
    }

    const busan = await this.runBusan(monthsAhead).catch((e) => {
      this.logger.error(`[Busan] 전체 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const daegu = await this.runDaegu(monthsAhead).catch((e) => {
      this.logger.error(`[Daegu] 전체 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const daejeonBoard = await this.runDaejeon(monthsAhead).catch((e) => {
      this.logger.error(`[Daejeon] 전체 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const daejeonPdf = await this.runDaejeonJubo().catch((e) => {
      this.logger.error(`[Daejeon Jubo] 실패: ${e.message}`);
      return 0;
    });
    const daejeon = daejeonBoard + daejeonPdf;
    await this.delay(2000);

    // ── 신규 교구 (Phase 2) — ★ 2026-03-06 실제 URL 검증 결과 적용 ────
    const seoul = await this.runGenericBoard({
      name: '서울대교구',
      defaultLocation: '서울대교구',
      diocese: '서울대교구',
      urls: [
        'https://aos.catholic.or.kr/con710',
        'https://aos.catholic.or.kr/news/notice',
        'https://aos.catholic.or.kr/schedule',
      ],
    }).catch((e) => { this.logger.error(`[Seoul] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const suwon = await this.runGenericBoard({
      name: '수원교구',
      defaultLocation: '수원교구',
      diocese: '수원교구',
      urls: [
        'https://www.casuwon.or.kr/info/event',
        'https://www.casuwon.or.kr/info/notice',
        'https://www.casuwon.or.kr/info/schedule',
      ],
    }).catch((e) => { this.logger.error(`[Suwon] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    // ★ 인천교구 — http:// 필수 (https 미지원), iframe 내부 /home.do 사용
    //   + 주보 PDF 자동 다운로드 (/upload/magazine/YYYYMM/YYYYMMDD_XXXX.pdf)
    const incheonBoard = await this.runGenericBoard({
      name: '인천교구',
      defaultLocation: '인천교구',
      diocese: '인천교구',
      urls: [
        'http://www.caincheon.or.kr/n/board/normal_mboard_list.do?i_sBidx=12',
        'http://www.caincheon.or.kr/n/board/normal_mboard_list.do?i_sBidx=11',
      ],
    }).catch((e) => { this.logger.error(`[Incheon Board] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const incheonPdf = await this.runIncheonJubo().catch((e) => {
      this.logger.error(`[Incheon Jubo] 실패: ${e.message}`);
      return 0;
    });
    const incheon = incheonBoard + incheonPdf;
    await this.delay(2000);

    // ── 추가 교구 (Phase 3) ────────────────────────────────────────────────
    const gwangju = await this.runGenericBoard({
      name: '광주대교구',
      defaultLocation: '광주대교구',
      diocese: '광주대교구',
      urls: [
        'https://samog.gjcatholic.or.kr/event/list/request/45',
        'https://samog.gjcatholic.or.kr/event/list/request/47',
        'https://www.gjcatholic.or.kr/nota/event',
        'https://www.gjcatholic.or.kr/archdiocese/archbishop/news',
      ],
    }).catch((e) => { this.logger.error(`[Gwangju] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const chuncheonBoard = await this.runGenericBoard({
      name: '춘천교구',
      defaultLocation: '춘천교구',
      diocese: '춘천교구',
      urls: [
        'https://www.cccatholic.or.kr/news/diocese',
        'https://www.cccatholic.or.kr/news/church',
      ],
    }).catch((e) => { this.logger.error(`[Chuncheon Board] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const chuncheonPdf = await this.runChuncheonJubo().catch((e) => {
      this.logger.error(`[Chuncheon Jubo] 실패: ${e.message}`);
      return 0;
    });
    const chuncheon = chuncheonBoard + chuncheonPdf;
    await this.delay(2000);

    const jeju = await this.runGenericBoard({
      name: '제주교구',
      defaultLocation: '제주교구',
      diocese: '제주교구',
      urls: [
        'https://www.diocesejeju.or.kr/board_diocese',
        'https://www.diocesejeju.or.kr/board_inform',
        'https://www.diocesejeju.or.kr/board_church',
      ],
    }).catch((e) => { this.logger.error(`[Jeju] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const wonju = await this.runGenericBoard({
      name: '원주교구',
      defaultLocation: '원주교구',
      diocese: '원주교구',
      urls: [
        'http://www.wjcatholic.or.kr/board/schedule',
        'http://www.wjcatholic.or.kr/board/notice',
        'http://www.wjcatholic.or.kr/board/notice2',
      ],
    }).catch((e) => { this.logger.error(`[Wonju] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const uijeongbu = await this.runGenericBoard({
      name: '의정부교구',
      defaultLocation: '의정부교구',
      diocese: '의정부교구',
      urls: [
        // ★ ucatholic.or.kr = 의정부교구 공식 그누보드 사이트 (cen.or.kr ASP보다 파싱 용이)
        'http://ucatholic.or.kr/bbs/board.php?bo_table=archive',
        'http://ucatholic.or.kr/bbs/board.php?bo_table=bishop_news',
        'http://ucatholic.or.kr/bbs/board.php?bo_table=jubo',
      ],
    }).catch((e) => { this.logger.error(`[Uijeongbu] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    const cheongju = await this.runCheongjuJubo().catch((e) => {
      this.logger.error(`[Cheongju Jubo] 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const masan = await this.runMasanJubo().catch((e) => {
      this.logger.error(`[Masan Jubo] 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const andong = await this.runAndongJubo().catch((e) => {
      this.logger.error(`[Andong Jubo] 실패: ${e.message}`);
      return 0;
    });
    await this.delay(2000);

    const gunjong = await this.runGenericBoard({
      name: '군종교구',
      defaultLocation: '군종교구',
      diocese: '군종교구',
      urls: [
        'https://www.gunjong.or.kr/parish/notice.asp',
      ],
    }).catch((e) => { this.logger.error(`[Gunjong] 실패: ${e.message}`); return 0; });
    await this.delay(2000);

    // ── CBCK (한국천주교주교회의) 공지사항 ──────────────────────────────────
    const cbck = await this.runGenericBoard({
      name: 'CBCK',
      defaultLocation: '한국천주교주교회의',
      diocese: 'CBCK',
      urls: [
        'https://www.cbck.or.kr/Notice?gb=K1200',
        'https://www.cbck.or.kr/Notice?gb=K1300',
        'https://www.cbck.or.kr/News',
      ],
    }).catch((e) => { this.logger.error(`[CBCK] 실패: ${e.message}`); return 0; });

    const result: DioceseSyncResult = {
      busan,
      daegu,
      daejeon,
      seoul,
      suwon,
      incheon,
      gwangju,
      chuncheon,
      jeju,
      wonju,
      uijeongbu,
      cheongju,
      masan,
      andong,
      gunjong,
      cbck,
      total: busan + daegu + daejeon + seoul + suwon + incheon +
             gwangju + chuncheon + jeju + wonju + uijeongbu + cheongju + masan + andong + gunjong + cbck,
    };

    this.logger.log(`[DioceseSync] 완료 → ${JSON.stringify(result)}`);
    return result;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 부산교구  — JSON REST API
  // GET https://catholicbusan.or.kr/news/schedule/schedule?date=YYYY-MM-DD&type=month
  // ══════════════════════════════════════════════════════════════════════════
  private async runBusan(monthsAhead: number): Promise<number> {
    let saved = 0;

    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i, 1);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

      try {
        saved += await this.fetchBusanMonth(dateStr);
      } catch (err) {
        this.logger.error(`[Busan] ${dateStr} 실패: ${(err as Error).message}`);
      }

      await this.delay(1500);
    }

    this.logger.log(`[Busan] 완료. 저장: ${saved}`);
    return saved;
  }

  private async fetchBusanMonth(date: string): Promise<number> {
    // ★ www 필수 — catholicbusan.or.kr (www 없이) → ECONNREFUSED
    const url = `https://www.catholicbusan.or.kr/news/schedule/schedule?date=${date}&type=month`;
    this.logger.log(`[Busan] GET ${url}`);

    // 부산교구 사이트는 Cloudflare 보호 적용 — 서버사이드 직접 요청 차단 가능
    // SCRAPER_API_KEY 가 있으면 프록시 경유, 없으면 직접 시도
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    const finalUrl = scraperApiKey
      ? `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=false`
      : url;

    const res = await axios.get(finalUrl, {
      timeout: 20000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://catholicbusan.or.kr/',
        Accept: 'application/json, */*',
      },
    });

    const body = res.data as any;

    // ★ API 응답 유효성 검증 — HTML/봇차단 페이지가 반환될 경우 대응
    if (typeof body === 'string') {
      const lower = body.toLowerCase();
      if (lower.includes('<!doctype') || lower.includes('<html')) {
        this.logger.warn(`[Busan] ${date} → JSON 대신 HTML 반환됨 (봇 차단 가능성)`);
        return 0;
      }
      if (lower.includes('captcha') || lower.includes('enable javascript') || lower.includes('접근이 차단')) {
        this.logger.warn(`[Busan] ${date} → 봇 차단 감지: CAPTCHA/JS 요구`);
        return 0;
      }
      // 문자열이지만 JSON일 수 있음 — 파싱 시도
      try {
        const parsed = JSON.parse(body);
        return this.processBusanItems(parsed, date);
      } catch {
        this.logger.warn(`[Busan] ${date} → 파싱 불가 응답: ${body.slice(0, 100)}`);
        return 0;
      }
    }

    return this.processBusanItems(body, date);
  }

  private async processBusanItems(body: any, date: string): Promise<number> {
    // 응답이 배열이거나 {schedule: [...]} 형태 모두 대응
    const items: any[] = Array.isArray(body)
      ? body
      : (body?.schedule ?? body?.data ?? body?.items ?? body?.list ?? []);

    if (!Array.isArray(items)) {
      this.logger.warn(`[Busan] ${date} → 응답에서 배열 추출 실패 (keys: ${Object.keys(body || {}).join(',')})`);
      return 0;
    }

    this.logger.log(`[Busan] ${date} → ${items.length}개 항목`);

    let saved = 0;
    for (const item of items) {
      if (await this.saveBusanItem(item)) saved++;
    }
    return saved;
  }

  private async saveBusanItem(item: any): Promise<boolean> {
    // 제목 — 다양한 필드명 허용
    const title = this.coerceStr(
      item.title ?? item.name ?? item.subject ?? item.TITLE ?? item.NAME,
    );
    if (!title || title.length < 2) return false;

    // 날짜
    const rawDate =
      item.SDATE ??
      item.sdate ??
      item.start_date ??
      item.startDate ??
      item.START_DT ??
      item.date ??
      null;
    const date = rawDate ? this.safeDate(rawDate) : null;

    // 장소
    const location =
      this.coerceStr(
        item.addr ?? item.address ?? item.venue ?? item.place ?? item.ADDR,
      ) || '부산교구';

    // 상세 URL — item.id 는 범용 필드라 seq 와 무관할 수 있으므로 제외
    const seq = item.seq ?? item.idx ?? item.SEQ ?? item.IDX;
    const originUrl = seq
      ? `https://catholicbusan.or.kr/news/schedule/view?seq=${seq}`
      : null;

    // 중복 체크
    const dup = await this.prisma.event.findFirst({
      where: originUrl
        ? { originUrl }
        : { title, ...(date ? { date } : {}) },
    });
    if (dup) {
      this.logger.debug(`[Busan] 중복 건너뜀: ${title}`);
      return false;
    }

    const category = this.detectCategory(
      title,
      this.coerceStr(item.category ?? item.type ?? ''),
    );

    // 요약 (API 에 내용 필드가 있을 경우)
    const rawSummary = [item.etc, item.content, item.description, item.memo]
      .filter(Boolean)
      .map(String)
      .join(' ')
      .slice(0, 500);
    const aiSummary = rawSummary.length > 5 ? rawSummary : null;

    await this.prisma.event.create({
      data: {
        title,
        date,
        location,
        aiSummary,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
        originUrl,
        category,
        diocese: '부산교구',
        status: 'APPROVED', // 교구 스크래핑 행사는 즉시 공개
      } as any,
    });

    this.logger.log(`[Busan] ✅ 저장: ${title} [${category}] @ ${location}`);
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 대구대교구 — HTML 월별 캘린더
  // GET https://daegu-archdiocese.or.kr/page/news.html?srl=schedule&nYear=YYYY&nMonth=M
  // ══════════════════════════════════════════════════════════════════════════
  private async runDaegu(monthsAhead: number): Promise<number> {
    let saved = 0;

    for (let i = 0; i < monthsAhead; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i, 1); // 두 번째 인수로 날짜를 1일로 고정 (월말 오버플로우 방지)
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      try {
        saved += await this.fetchDaeguMonth(year, month);
      } catch (err) {
        this.logger.error(
          `[Daegu] ${year}-${month} 실패: ${(err as Error).message}`,
        );
      }

      await this.delay(2000);
    }

    this.logger.log(`[Daegu] 완료. 저장: ${saved}`);
    return saved;
  }

  private async fetchDaeguMonth(year: number, month: number): Promise<number> {
    const url = `https://daegu-archdiocese.or.kr/page/news.html?srl=schedule&nYear=${year}&nMonth=${month}`;
    this.logger.log(`[Daegu] GET ${url}`);

    const res = await axios.get<ArrayBuffer>(url, {
      timeout: 15000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = this.decodeKorean(
      Buffer.from(res.data),
      res.headers['content-type'],
    );

    if (this.detectBotBlock(html, 'Daegu')) return 0;

    const events = this.parseDaeguHtml(html, year, month);
    this.logger.log(`[Daegu] ${year}-${month} → ${events.length}개 이벤트 파싱`);

    let saved = 0;
    for (const evt of events) {
      if (await this.saveGenericEvent(evt, '[Daegu]')) saved++;
    }
    return saved;
  }

  private parseDaeguHtml(
    html: string,
    year: number,
    month: number,
  ): DioceseEvent[] {
    const events: DioceseEvent[] = [];
    const seen = new Set<string>();

    // ── 패턴 1: 상세 페이지 링크 파싱 ──────────────────────────────────────
    //   ★ 내부 태그 허용: <a href="..."><span>제목</span></a> 도 매칭
    const linkRe =
      /href="([^"]*(?:news_view|board_view|view|detail|read|idx=|no=|seq=)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1].trim();
      // ★ 내부 HTML 태그 제거 후 텍스트만 추출
      const rawTitle = m[2].replace(/<[^>]+>/g, '').trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

      if (!rawTitle || seen.has(rawTitle)) continue;
      if (rawTitle.length < 3 || /^\d+$/.test(rawTitle)) continue;
      if (['더보기', '자세히', '목록', '이전', '다음', '검색', '닫기'].includes(rawTitle)) continue;

      seen.add(rawTitle);

      const originUrl = href.startsWith('http')
        ? href
        : `https://daegu-archdiocese.or.kr${href.startsWith('/') ? '' : '/'}${href}`;

      // 링크 앞 텍스트에서 날짜 추출 시도 (dd 형태)
      const dayMatch = html
        .slice(Math.max(0, m.index - 200), m.index)
        .match(/(\d{1,2})\s*[일\(]/g);
      const day = dayMatch
        ? parseInt(dayMatch[dayMatch.length - 1])
        : 1;

      const category = this.detectCategory(rawTitle, '');
      events.push({
        title: rawTitle,
        date: new Date(year, month - 1, isNaN(day) ? 1 : Math.min(day, 28)),
        location: '대구대교구',
        originUrl,
        category,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
        diocese: '대구대교구',
      });
    }

    // ── 패턴 2: 링크가 없으면 텍스트 추출 ──────────────────────────────────
    if (events.length === 0) {
      this.logger.warn('[Daegu] 링크 미발견 → 텍스트 추출 폴백');
      const text = convert(html, {
        wordwrap: false,
        selectors: [
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: 'nav', format: 'skip' },
          { selector: 'footer', format: 'skip' },
        ],
      });

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 5 && l.length <= 80 && /[가-힣]/.test(l));

      for (const line of lines.slice(0, 30)) {
        if (seen.has(line)) continue;
        seen.add(line);
        const category = this.detectCategory(line, '');
        events.push({
          title: line,
          date: null,
          location: '대구대교구',
          originUrl: `https://daegu-archdiocese.or.kr/page/news.html?srl=schedule&nYear=${year}&nMonth=${month}`,
          category,
          themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
          diocese: '대구대교구',
        });
      }
    }

    return events;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 대전교구 — 월간계획 게시판
  // GET http://www.djcatholic.or.kr/home/news/monthplan.php
  // ══════════════════════════════════════════════════════════════════════════
  private async runDaejeon(monthsAhead: number): Promise<number> {
    let saved = 0;

    // 대전교구는 페이지 번호 기반
    // monthsAhead에 비례해 수집 페이지 수 조정 (최소 1, 최대 6)
    const pagesToFetch = Math.min(Math.max(Math.ceil(monthsAhead / 2), 1), 6);
    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        saved += await this.fetchDaejeonPage(page);
      } catch (err) {
        this.logger.error(
          `[Daejeon] 페이지${page} 실패: ${(err as Error).message}`,
        );
      }
      await this.delay(2000);
    }

    this.logger.log(`[Daejeon] 완료. 저장: ${saved}`);
    return saved;
  }

  private async fetchDaejeonPage(page: number): Promise<number> {
    const url = `https://www.djcatholic.or.kr/home/news/monthplan.php?pg=${page}`;
    this.logger.log(`[Daejeon] GET ${url}`);

    const res = await axios.get<ArrayBuffer>(url, {
      timeout: 15000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
    });

    const html = this.decodeKorean(
      Buffer.from(res.data),
      res.headers['content-type'],
    );

    if (this.detectBotBlock(html, 'Daejeon')) return 0;

    const events = this.parseDaejeonHtml(html);
    this.logger.log(`[Daejeon] 페이지${page} → ${events.length}개 파싱`);

    let saved = 0;
    for (const evt of events) {
      if (await this.saveGenericEvent(evt, '[Daejeon]')) saved++;
    }
    return saved;
  }

  private parseDaejeonHtml(html: string): DioceseEvent[] {
    const events: DioceseEvent[] = [];
    const seen = new Set<string>();

    // 실제 대전교구 URL 패턴: /home/news/monthplan.php?enter=v&idx=XXXXX
    // 또는 gnuboard 패턴(wr_id=) 도 대응
    // ★ 내부 태그 허용: <a href="..."><span>제목</span></a> 도 매칭
    const linkRe =
      /href="([^"]*(?:enter=v|view|read|plan_view|monthplan_view|wr_id=)[^"]*(?:idx=|wr_id=)\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1].trim();
      // ★ 내부 HTML 태그 제거 후 텍스트만 추출
      const rawTitle = m[2].replace(/<[^>]+>/g, '').trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

      if (!rawTitle || seen.has(rawTitle)) continue;
      if (rawTitle.length < 3 || /^\d+$/.test(rawTitle)) continue;
      if (['목록', '검색', '이전', '다음'].includes(rawTitle)) continue;
      // ★ "행사계획표" 등 월별 일람 페이지 → 개별 행사 아님 → 스킵
      if (/행사계획표|월간일정|행사일정표|일정안내$/.test(rawTitle)) continue;
      // ★ 단순 날짜 제목 ("2026년 3월" 등) 스킵
      if (/^\d{4}년\s*\d{1,2}월\s*$/.test(rawTitle.trim())) continue;

      seen.add(rawTitle);

      const originUrl = href.startsWith('http')
        ? href
        : `https://www.djcatholic.or.kr${href.startsWith('/') ? '' : '/'}${href}`;

      // 날짜: 링크 주변 텍스트에서 YYYY-MM-DD 또는 YYYY.MM.DD 탐색
      const surroundingText = html.slice(
        Math.max(0, m.index - 300),
        m.index + 300,
      );
      const dateMatch = surroundingText.match(
        /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
      );
      const date: Date | null = dateMatch
        ? new Date(
            parseInt(dateMatch[1]),
            parseInt(dateMatch[2]) - 1,
            parseInt(dateMatch[3]),
          )
        : null;

      const category = this.detectCategory(rawTitle, '');
      events.push({
        title: rawTitle,
        date,
        location: '대전교구',
        originUrl,
        category,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
        diocese: '대전교구',
      });
    }

    return events;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 공통 저장 + 유틸리티
  // ══════════════════════════════════════════════════════════════════════════

  private async saveGenericEvent(
    evt: DioceseEvent,
    prefix: string,
  ): Promise<boolean> {
    // 중복 체크: originUrl 우선, 없으면 title+date 조합
    // ★ title 단독 체크 시 30일 윈도우 적용 → 연간 반복 행사 영구 차단 방지
    let dupWhere: any;
    if (evt.originUrl) {
      dupWhere = { originUrl: evt.originUrl };
    } else if (evt.date) {
      // title + date 조합으로 더 정밀한 중복 탐지
      const dayStart = new Date(evt.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(evt.date);
      dayEnd.setHours(23, 59, 59, 999);
      dupWhere = {
        title: evt.title,
        date: { gte: dayStart, lte: dayEnd },
      };
    } else {
      // ★ 제목 단독 + 최근 30일 내 생성된 것만 중복으로 판단
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dupWhere = {
        title: evt.title,
        createdAt: { gte: thirtyDaysAgo },
      };
    }
    const dup = await this.prisma.event.findFirst({ where: dupWhere });

    if (dup) {
      this.logger.debug(`${prefix} 중복: ${evt.title}`);
      return false;
    }

    await this.prisma.event.create({
      data: {
        title: evt.title,
        date: evt.date,
        location: evt.location,
        aiSummary: evt.aiSummary ?? null,
        themeColor: evt.themeColor,
        originUrl: evt.originUrl,
        category: evt.category,
        diocese: evt.diocese ?? null,
        status: 'APPROVED', // 교구 스크래핑 행사는 즉시 공개
      } as any,
    });

    this.logger.log(
      `${prefix} ✅ 저장: "${evt.title}" [${evt.category}] @ ${evt.location}`,
    );
    return true;
  }

  /** 봇 차단 / CAPTCHA 감지 — HTML 응답이 실제 콘텐츠인지 검증 */
  private detectBotBlock(html: string, label: string): boolean {
    const lower = html.toLowerCase();
    if (lower.includes('captcha') || lower.includes('recaptcha')) {
      this.logger.warn(`[${label}] 봇 차단 감지: CAPTCHA 페이지`);
      return true;
    }
    if (lower.includes('enable javascript') || lower.includes('javascript를 활성화')) {
      this.logger.warn(`[${label}] 봇 차단 감지: JS 요구 페이지`);
      return true;
    }
    if (lower.includes('접근이 차단') || lower.includes('access denied') || lower.includes('403 forbidden')) {
      this.logger.warn(`[${label}] 봇 차단 감지: 접근 거부`);
      return true;
    }
    // 극단적으로 짧은 HTML(200자 미만)은 빈 페이지/리다이렉트일 가능성
    if (html.length < 200 && !html.includes('<table') && !html.includes('<div')) {
      this.logger.warn(`[${label}] 의심: HTML이 ${html.length}자로 매우 짧음`);
      return true;
    }
    return false;
  }

  /** 한국어 HTML 인코딩 감지 및 디코딩 (UTF-8 / EUC-KR) */
  private decodeKorean(buffer: Buffer, contentType?: string): string {
    const ctLower = (contentType ?? '').toLowerCase();

    const isEucKr =
      ctLower.includes('euc-kr') ||
      ctLower.includes('ks_c_5601') ||
      ctLower.includes('ksc5601');

    if (isEucKr) {
      try {
        return new TextDecoder('euc-kr').decode(buffer);
      } catch {
        /* fall through */
      }
    }

    const utf8 = buffer.toString('utf-8');

    // Content-Type 헤더에 없어도 meta charset 으로 감지
    if (
      utf8.toLowerCase().includes('charset=euc-kr') ||
      utf8.toLowerCase().includes('charset=ks_c_5601')
    ) {
      try {
        return new TextDecoder('euc-kr').decode(buffer);
      } catch {
        /* fall through */
      }
    }

    return utf8;
  }

  /** 카테고리 탐지 — 뉴스 우선 필터 + 행사 카테고리 매칭 */
  private detectCategory(title: string, type: string): string {
    const t = (title + ' ' + type).replace(/\s+/g, '');

    // ── 1단계: 뉴스/비행사 콘텐츠 우선 필터 ──
    if (/인사발령|인사이동|임명|착좌|서품식|축성식|선종|장례|부고|서거|추모미사/.test(t)) return '뉴스';
    if (/담화문|사목교서|성명서|교서|회칙|권고문|주교회의|교구장/.test(t)) return '뉴스';
    if (/교구소식|보도자료|기자회견|뉴스|취재|인터뷰|논평/.test(t)) return '뉴스';
    if (/공지사항|안내문|총회|이사회|결산|예산|통계|현황|보고서/.test(t)) return '뉴스';
    if (/사순담화|부활담화|성탄담화|평화메시지/.test(t)) return '뉴스';
    if (/후기|탐방기|체험기|소감문|방문기/.test(t)) return '뉴스';
    if (/모집공고|채용|구인|입찰|공모/.test(t)) return '뉴스';

    // ── 2단계: 행사 카테고리 매칭 (기존 로직 유지) ──
    // 피정의집 (수도원 거주 프로그램) — 피정보다 먼저 검사
    if (/피정의집|수련원|영성원|봉쇄피정|묵주기도의집|성모피정원|이냐시오피정|수도원프로그램/.test(t)) return '피정의집';
    // 피정
    if (/피정|영성수련|묵상|성령쇄신|마리아의밤|관상기도|침묵피정/.test(t)) return '피정';
    // 강론 (설교·사목서한)
    if (/강론|설교|사목서한|강론집/.test(t)) return '강론';
    // 특강 (초청강연·공개강좌)
    if (/특강|초청강연|공개강좌|심포지엄|포럼/.test(t)) return '특강';
    // 강의 (정규 교육 과정)
    if (/강의|강좌|교육|세미나|렉시오|성경|교리|신학/.test(t)) return '강의';
    // 미사·전례
    if (/미사|전례|기도회|성시간|연도|위령|성체거양|복사단/.test(t)) return '미사';
    // 순례
    if (/순례|성지|도보순례|성당탐방|순례길/.test(t)) return '순례';
    // 청년
    if (/청년|Youth|youth|대학|청소년|성소/.test(t)) return '청년';
    // 문화
    if (/음악회|공연|전시|합창|연극|음악제|뮤지컬|콘서트|축제/.test(t)) return '문화';
    // 선교·봉사
    if (/선교|봉사|레지오|복음화|사회사목|자선/.test(t)) return '선교';

    // ── 3단계: 매칭 실패 → 뉴스로 분류 ──
    return '뉴스';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Generic Board Scraper — 표준 HTML 게시판 구조 범용 파서
  // 부산·대구·대전 전용 스크래퍼 외 교구에 사용
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * 여러 URL 후보를 순서대로 시도하여 첫 번째로 이벤트를 반환하는 URL 사용.
   * 실패해도 catch 없이 상위에서 처리 (runAll에서 catch).
   */
  private async runGenericBoard(config: {
    name: string;
    urls: string[];
    defaultLocation: string;
    linkRe?: RegExp;
    diocese?: string;
  }): Promise<number> {
    this.logger.log(`[${config.name}] 게시판 수집 시작`);

    for (const url of config.urls) {
      try {
        const res = await axios.get<ArrayBuffer>(url, {
          timeout: 12000,
          responseType: 'arraybuffer',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
          },
        });

        const html = this.decodeKorean(Buffer.from(res.data), res.headers['content-type']);

        if (this.detectBotBlock(html, config.name)) continue;

        const events = this.parseGenericBoard(html, url, config.defaultLocation, config.linkRe, config.diocese ?? config.name);

        if (events.length === 0) {
          this.logger.warn(`[${config.name}] ${url} — 이벤트 0건 파싱됨. 다음 URL 시도.`);
          continue;
        }

        this.logger.log(`[${config.name}] ${url} → ${events.length}건 파싱`);
        let saved = 0;
        for (const evt of events) {
          if (await this.saveGenericEvent(evt, `[${config.name}]`)) saved++;
        }
        this.logger.log(`[${config.name}] 완료. 저장: ${saved}`);
        return saved;
      } catch (err) {
        this.logger.warn(`[${config.name}] ${url} 접근 실패: ${(err as Error).message}`);
      }
    }

    this.logger.warn(`[${config.name}] 모든 URL 실패. 저장: 0`);
    return 0;
  }

  /**
   * 한국 가톨릭 게시판의 공통 HTML 패턴에서 이벤트 링크·제목·날짜 추출.
   * 교구마다 약간씩 다른 href/텍스트 패턴을 모두 포괄하는 넓은 정규식 사용.
   */
  private parseGenericBoard(
    html: string,
    baseUrl: string,
    defaultLocation: string,
    linkRe?: RegExp,
    diocese?: string,
  ): DioceseEvent[] {
    const events: DioceseEvent[] = [];
    const seen = new Set<string>();

    let baseHost: string;
    try {
      baseHost = new URL(baseUrl).origin;
    } catch {
      baseHost = '';
    }

    // 한국 가톨릭 CMS(그누보드·XE·자체·ASP) 공통 상세 페이지 URL 패턴
    // ★ XE: /board_diocese/12345, viewMode=view, document_srl= 패턴 추가
    // ★ ASP: exe=view, single-quote href 대응
    // ★ 내부 태그 허용: <a href="..."><span>제목</span></a> 도 매칭
    const re =
      linkRe ??
      /href=["']([^"']*(?:view|read|detail|notice_view|board_view|schedule_view|plan_view|viewMode=view|exe=view|document_srl=|idx=|no=|seq=|wr_id=|\/board_\w+\/\d|\/news\/\w+\/\d)\d*[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      const href = m[1].trim();
      // ★ 내부 HTML 태그 제거 후 텍스트만 추출
      const rawTitle = m[2]
        .replace(/<[^>]+>/g, '')
        .trim()
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ');

      if (!rawTitle || seen.has(rawTitle)) continue;
      if (rawTitle.length < 3 || /^\d+$/.test(rawTitle)) continue;
      if (
        ['더보기', '자세히', '목록', '이전', '다음', '검색', '닫기', '공지', '수정', '삭제'].includes(
          rawTitle,
        )
      )
        continue;
      // 한국어 글자가 전혀 없으면 제외
      if (!/[가-힣]/.test(rawTitle)) continue;

      seen.add(rawTitle);

      const originUrl =
        href.startsWith('http')
          ? href
          : `${baseHost}${href.startsWith('/') ? '' : '/'}${href}`;

      // 주변 텍스트에서 날짜 추출 (YYYY-MM-DD 또는 YYYY.MM.DD)
      const context = html.slice(Math.max(0, m.index - 400), m.index + 100);
      const dateMatch = context.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
      const date: Date | null = dateMatch
        ? new Date(
            parseInt(dateMatch[1]),
            parseInt(dateMatch[2]) - 1,
            parseInt(dateMatch[3]),
          )
        : null;

      // 날짜를 파악한 경우에만 과거 이벤트 필터 적용 (날짜 불명 → 포함)
      if (date !== null) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if (date < twoWeeksAgo) continue;
      }

      const category = this.detectCategory(rawTitle, '');
      events.push({
        title: rawTitle,
        date,
        location: defaultLocation,
        originUrl,
        category,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
        diocese: diocese ?? defaultLocation,
      });
    }

    return events.slice(0, 50); // 교구당 최대 50건
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 인천교구 주보 PDF 자동 수집
  // URL 패턴: http://www.caincheon.or.kr/upload/magazine/YYYYMM/YYYYMMDD_XXXX.pdf
  // 매주 일요일 발행, 호수 자동 추정
  // ══════════════════════════════════════════════════════════════════════════
  private async runIncheonJubo(): Promise<number> {
    this.logger.log('[Incheon Jubo] 주보 PDF 수집 시작');

    // 최근 4주분 주보 PDF URL 후보 생성
    const urls = this.generateIncheonJuboUrls(4);
    let totalSaved = 0;

    for (const url of urls) {
      try {
        const saved = await this.fetchAndParseJuboPdf(url, '인천교구');
        totalSaved += saved;
      } catch (err) {
        this.logger.debug(`[Incheon Jubo] ${url} 건너뜀: ${(err as Error).message}`);
      }
      await this.delay(1000);
    }

    this.logger.log(`[Incheon Jubo] 완료. 저장: ${totalSaved}`);
    return totalSaved;
  }

  /** 인천교구 주보 PDF URL 후보 목록 생성 (최근 N주) */
  private generateIncheonJuboUrls(weeks: number): string[] {
    const urls: string[] = [];
    const now = new Date();

    // 기준 호수: 2026-03-15 = 제2924호
    const baseDate = new Date(2026, 2, 15); // 2026-03-15
    const baseIssue = 2924;

    for (let w = 0; w < weeks; w++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (w * 7));

      // 가장 가까운 일요일(과거) 찾기
      const day = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - day);

      const yyyy = sunday.getFullYear();
      const mm = String(sunday.getMonth() + 1).padStart(2, '0');
      const dd = String(sunday.getDate()).padStart(2, '0');

      // 호수 추정: 기준일과의 주 차이
      const diffWeeks = Math.round((sunday.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const issue = baseIssue + diffWeeks;

      // URL: /upload/magazine/YYYYMM/YYYYMMDD_XXXX.pdf
      const url = `http://www.caincheon.or.kr/upload/magazine/${yyyy}${mm}/${yyyy}${mm}${dd}_${issue}.pdf`;
      urls.push(url);
    }

    return urls;
  }

  /** PDF 다운로드 → 텍스트 추출 → 행사 파싱 → DB 저장 */
  private async fetchAndParseJuboPdf(pdfUrl: string, location: string, diocese?: string): Promise<number> {
    this.logger.log(`[Jubo PDF] 다운로드: ${pdfUrl}`);

    // URL에서 host 추출하여 Referer로 사용
    let referer = '';
    try { referer = new URL(pdfUrl).origin + '/'; } catch { /* ignore */ }

    const res = await axios.get(pdfUrl, {
      timeout: 60000,
      responseType: 'arraybuffer',
      maxRedirects: 5,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,*/*',
        ...(referer ? { 'Referer': referer } : {}),
      },
      validateStatus: (s) => s === 200,
    });

    const buffer = Buffer.from(res.data);

    // PDF 유효성 검증 — %PDF 매직 바이트 확인
    if (buffer.length < 100 || buffer.slice(0, 5).toString('ascii') !== '%PDF-') {
      this.logger.warn(`[Jubo PDF] PDF 아님 (HTML 반환 가능성): ${pdfUrl} (${buffer.length}바이트)`);
      return 0;
    }

    this.logger.log(`[Jubo PDF] 다운로드 완료: ${buffer.length}바이트`);
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text;

    if (!text || text.length < 100) {
      this.logger.warn(`[Jubo PDF] 텍스트 추출 실패 (${text?.length ?? 0}자): ${pdfUrl}`);
      return 0;
    }

    this.logger.log(`[Jubo PDF] 텍스트 추출: ${text.length}자, ${pdfData.numpages}페이지`);

    // 행사 정보 추출 (정규식 기반)
    const events = this.parseJuboText(text, pdfUrl, location, diocese);
    this.logger.log(`[Jubo PDF] ${events.length}개 행사 파싱`);

    let saved = 0;
    for (const evt of events) {
      if (await this.saveGenericEvent(evt, '[Jubo PDF]')) saved++;
    }
    return saved;
  }

  /** 주보 텍스트에서 행사 정보 추출 */
  private parseJuboText(text: string, pdfUrl: string, defaultLocation: string, diocese?: string): DioceseEvent[] {
    const events: DioceseEvent[] = [];
    const seen = new Set<string>();
    const currentYear = new Date().getFullYear();

    // 패턴: "일시: M/DD(요일) HH:MM" 앞의 행사 제목 + 일시/장소/문의 블록
    // 주보의 일반적 구조:
    //   행사 제목
    //   일시: 3/24(화) 10:30
    //   장소: 어디어디
    //   문의: 032-XXX-XXXX

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // "일시:", "때:", "기간:", "날짜:" 패턴 탐색 (구분자: 콜론, 밑줄, 하이픈)
      const timeMatch = line.match(/(?:일시|때|기간|날짜)\s*[:：_\-]\s*(.+)/);
      if (!timeMatch) continue;

      const timeStr = timeMatch[1].trim();

      // 날짜 추출: YYYY.M.DD, YYYY년 M월 DD일, M/DD, M월 DD일, M.DD
      let date: Date | null = null;
      const fullDateMatch = timeStr.match(/(\d{4})[.\-\/년]\s*(\d{1,2})[.\-\/월]\s*(\d{1,2})/);
      if (fullDateMatch) {
        date = new Date(parseInt(fullDateMatch[1]), parseInt(fullDateMatch[2]) - 1, parseInt(fullDateMatch[3]));
      } else {
        const shortDateMatch = timeStr.match(/(\d{1,2})[\/월.\-](\d{1,2})/);
        if (shortDateMatch) {
          const month = parseInt(shortDateMatch[1]) - 1;
          const day = parseInt(shortDateMatch[2]);
          date = new Date(currentYear, month, day);
          // 과거 6개월 이상이면 내년으로
          const now = new Date();
          if (date.getTime() < now.getTime() - 180 * 24 * 60 * 60 * 1000) {
            date.setFullYear(currentYear + 1);
          }
        }
      }

      // 제목: 일시 행 위의 1~3줄 탐색 (비어있지 않고 "장소:", "문의:" 등이 아닌 행)
      let title = '';
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const prev = lines[j];
        if (/^(일시|때|장소|문의|대상|비용|기간|강사|접수|신청|수강|모집|날짜|시간|연락처)\s*[:：]/.test(prev)) continue;
        if (prev.length < 3 || prev.length > 60) continue;
        if (/^\d+$/.test(prev)) continue;
        // 한글 포함 확인
        if (/[가-힣]/.test(prev)) {
          title = prev;
          break;
        }
      }

      if (!title || seen.has(title)) continue;
      // 비 행사 제목 필터
      if (/^(교구청|교육|모집|순례|기타|알림|교구소식)$/.test(title)) continue;
      seen.add(title);

      // 장소 추출
      let eventLocation = defaultLocation;
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const locMatch = lines[j].match(/장소\s*[:：]\s*(.+)/);
        if (locMatch) {
          eventLocation = locMatch[1].trim().slice(0, 100) || defaultLocation;
          break;
        }
      }

      // 2주 이전 과거 행사 제외
      if (date) {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if (date < twoWeeksAgo) continue;
      }

      const category = this.detectCategory(title, '');
      events.push({
        title,
        date,
        location: eventLocation,
        originUrl: `${pdfUrl}#${encodeURIComponent(title)}`,
        category,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
        diocese: diocese ?? defaultLocation,
      });
    }

    return events.slice(0, 50);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 춘천교구 주보 PDF 자동 수집
  // 목록 페이지에서 PDF URL을 추출 → pdf-parse로 텍스트 추출 → 행사 파싱
  // ══════════════════════════════════════════════════════════════════════════
  private async runChuncheonJubo(): Promise<number> {
    this.logger.log('[Chuncheon Jubo] 주보 PDF 수집 시작');

    try {
      // 주보 목록 페이지에서 최신 PDF 타임스탬프 추출
      const listRes = await axios.get('https://www.cccatholic.or.kr/publication/jubo', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });

      const html = typeof listRes.data === 'string' ? listRes.data : '';
      // 패턴: /uploads/ccd01/ext_jubo/TIMESTAMP/TIMESTAMP.pdf
      const pdfRe = /\/uploads\/ccd01\/ext_jubo\/(\d+)\/\1\.pdf/g;
      const timestamps = new Set<string>();
      let pm: RegExpExecArray | null;
      while ((pm = pdfRe.exec(html)) !== null) {
        timestamps.add(pm[1]);
      }

      // 썸네일에서도 추출: /uploads/ccd01/ext_jubo/TIMESTAMP/TIMESTAMP.pdf_thumb.png
      const thumbRe = /\/uploads\/ccd01\/ext_jubo\/(\d+)\/\1\.pdf_thumb/g;
      while ((pm = thumbRe.exec(html)) !== null) {
        timestamps.add(pm[1]);
      }

      const sorted = [...timestamps].sort((a, b) => Number(b) - Number(a));
      this.logger.log(`[Chuncheon Jubo] ${sorted.length}개 주보 발견`);

      // 최근 2개만 처리
      let totalSaved = 0;
      for (const ts of sorted.slice(0, 2)) {
        const pdfUrl = `https://www.cccatholic.or.kr/uploads/ccd01/ext_jubo/${ts}/${ts}.pdf`;
        try {
          const saved = await this.fetchAndParseJuboPdf(pdfUrl, '춘천교구');
          totalSaved += saved;
        } catch (err) {
          this.logger.debug(`[Chuncheon Jubo] ${pdfUrl} 실패: ${(err as Error).message}`);
        }
        await this.delay(1000);
      }

      this.logger.log(`[Chuncheon Jubo] 완료. 저장: ${totalSaved}`);
      return totalSaved;
    } catch (err) {
      this.logger.error(`[Chuncheon Jubo] 목록 페이지 실패: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 안동교구 주보 PDF 자동 수집
  // 목록(sub6/sub1.asp)에서 직접 PDF 링크 추출 → 다운로드 → 파싱
  // ══════════════════════════════════════════════════════════════════════════
  private async runAndongJubo(): Promise<number> {
    this.logger.log('[Andong Jubo] 주보 PDF 수집 시작');

    try {
      const listRes = await axios.get('https://www.acatholic.or.kr/sub6/sub1.asp', {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.acatholic.or.kr/',
        },
      });

      const html = typeof listRes.data === 'string' ? listRes.data : '';
      // href="/gears_pds/program/newsletter/2026.3.15.376호.pdf" 패턴
      const pdfRe = /href="(\/gears_pds\/program\/newsletter\/[^"]+\.pdf)"/g;
      const pdfPaths: string[] = [];
      let pm: RegExpExecArray | null;
      while ((pm = pdfRe.exec(html)) !== null) {
        if (!pdfPaths.includes(pm[1])) pdfPaths.push(pm[1]);
      }

      this.logger.log(`[Andong Jubo] ${pdfPaths.length}개 주보 PDF 발견`);

      // 최근 2개만 처리
      let totalSaved = 0;
      for (const path of pdfPaths.slice(0, 2)) {
        // 한글 파일명 URL 인코딩
        const pdfUrl = encodeURI(`https://www.acatholic.or.kr${path}`);
        try {
          const saved = await this.fetchAndParseJuboPdf(pdfUrl, '안동교구', '안동교구');
          totalSaved += saved;
        } catch (err) {
          this.logger.debug(`[Andong Jubo] ${pdfUrl} 실패: ${(err as Error).message}`);
        }
        await this.delay(1000);
      }

      this.logger.log(`[Andong Jubo] 완료. 저장: ${totalSaved}`);
      return totalSaved;
    } catch (err) {
      this.logger.error(`[Andong Jubo] 목록 페이지 실패: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 마산교구 교구보 PDF 자동 수집
  // 목록(/C_8)에서 docId → 상세에서 file_srl+sid → PDF 다운로드 → 파싱
  // ══════════════════════════════════════════════════════════════════════════
  private async runMasanJubo(): Promise<number> {
    this.logger.log('[Masan Jubo] 교구보 PDF 수집 시작');

    try {
      // ★ cathms.kr SSL 인증서 체인 불완전 → rejectUnauthorized: false 필요
      const agent = new https.Agent({ rejectUnauthorized: false });
      const listRes = await axios.get('https://cathms.kr/C_8', {
        timeout: 15000,
        httpsAgent: agent,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });

      const html = typeof listRes.data === 'string' ? listRes.data : '';
      // href="/C_8/26512" 패턴에서 docId 추출
      const docRe = /href="\/C_8\/(\d+)"/g;
      const docIds = new Set<string>();
      let dm: RegExpExecArray | null;
      while ((dm = docRe.exec(html)) !== null) {
        docIds.add(dm[1]);
      }
      const sorted = [...docIds].sort((a, b) => Number(b) - Number(a));

      this.logger.log(`[Masan Jubo] ${sorted.length}개 교구보 발견: ${sorted.slice(0, 3).join(', ')}`);

      // 최근 2개만 처리
      let totalSaved = 0;
      for (const docId of sorted.slice(0, 2)) {
        try {
          // 상세 페이지에서 file_srl + sid 추출
          const detailRes = await axios.get(`https://cathms.kr/C_8/${docId}`, {
            timeout: 15000,
            httpsAgent: agent,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          });
          const detailHtml = typeof detailRes.data === 'string' ? detailRes.data : '';

          // data-file-srl="26513" href="/index.php?module=file&act=procFileDownload&file_srl=26513&sid=..."
          const fileMatch = detailHtml.match(/file_srl=(\d+)&(?:amp;)?sid=([a-f0-9]+)/);
          if (!fileMatch) {
            this.logger.debug(`[Masan Jubo] docId ${docId}: file_srl 미발견`);
            continue;
          }

          const pdfUrl = `https://cathms.kr/index.php?module=file&act=procFileDownload&file_srl=${fileMatch[1]}&sid=${fileMatch[2]}`;
          const saved = await this.fetchAndParseJuboPdf(pdfUrl, '마산교구', '마산교구');
          totalSaved += saved;
        } catch (err) {
          this.logger.debug(`[Masan Jubo] docId ${docId} 실패: ${(err as Error).message}`);
        }
        await this.delay(1000);
      }

      this.logger.log(`[Masan Jubo] 완료. 저장: ${totalSaved}`);
      return totalSaved;
    } catch (err) {
      this.logger.error(`[Masan Jubo] 목록 페이지 실패: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 청주교구 주보 PDF 자동 수집
  // 목록 페이지(/media/journal)에서 idx 추출 → /media/journal/download?idx= 로 PDF 다운로드
  // ══════════════════════════════════════════════════════════════════════════
  private async runCheongjuJubo(): Promise<number> {
    this.logger.log('[Cheongju Jubo] 주보 PDF 수집 시작');

    try {
      const listRes = await axios.get('https://www.cdcj.or.kr/media/journal', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });

      const html = typeof listRes.data === 'string' ? listRes.data : '';
      // href="/media/journal/1060" 패턴에서 idx 추출
      const idxRe = /href="\/media\/journal\/(\d+)"/g;
      const idxSet = new Set<string>();
      let im: RegExpExecArray | null;
      while ((im = idxRe.exec(html)) !== null) {
        idxSet.add(im[1]);
      }
      const idxList = [...idxSet].sort((a, b) => Number(b) - Number(a));

      this.logger.log(`[Cheongju Jubo] ${idxList.length}개 주보 발견: ${idxList.slice(0, 3).join(', ')}`);

      // 최근 2개만 처리
      let totalSaved = 0;
      for (const idx of idxList.slice(0, 2)) {
        const pdfUrl = `https://www.cdcj.or.kr/media/journal/download?idx=${idx}`;
        try {
          const saved = await this.fetchAndParseJuboPdf(pdfUrl, '청주교구', '청주교구');
          totalSaved += saved;
        } catch (err) {
          this.logger.debug(`[Cheongju Jubo] ${pdfUrl} 실패: ${(err as Error).message}`);
        }
        await this.delay(1000);
      }

      this.logger.log(`[Cheongju Jubo] 완료. 저장: ${totalSaved}`);
      return totalSaved;
    } catch (err) {
      this.logger.error(`[Cheongju Jubo] 목록 페이지 실패: ${(err as Error).message}`);
      return 0;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 대전교구 주보 PDF 자동 수집
  // 목록 페이지(last.asp)에서 호수 추출 → download.asp?f={호수}.pdf 다운로드 → 파싱
  // ══════════════════════════════════════════════════════════════════════════
  private async runDaejeonJubo(): Promise<number> {
    this.logger.log('[Daejeon Jubo] 주보 PDF 수집 시작');

    try {
      const listRes = await axios.get('https://jubo.djcatholic.or.kr/home/last.asp', {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });

      const html = typeof listRes.data === 'string' ? listRes.data : '';
      // btn_download data="2887.pdf" 패턴에서 호수 추출
      const issueRe = /btn_download[^>]*data="(\d+)\.pdf"/g;
      const issues: string[] = [];
      let im: RegExpExecArray | null;
      while ((im = issueRe.exec(html)) !== null) {
        if (!issues.includes(im[1])) issues.push(im[1]);
      }

      this.logger.log(`[Daejeon Jubo] ${issues.length}개 주보 발견: ${issues.slice(0, 3).join(', ')}`);

      // 최근 2개만 처리
      let totalSaved = 0;
      for (const issue of issues.slice(0, 2)) {
        const pdfUrl = `https://jubo.djcatholic.or.kr/download.asp?f=${issue}.pdf`;
        try {
          const saved = await this.fetchAndParseJuboPdf(pdfUrl, '대전교구', '대전교구');
          totalSaved += saved;
        } catch (err) {
          this.logger.debug(`[Daejeon Jubo] ${pdfUrl} 실패: ${(err as Error).message}`);
        }
        await this.delay(1000);
      }

      this.logger.log(`[Daejeon Jubo] 완료. 저장: ${totalSaved}`);
      return totalSaved;
    } catch (err) {
      this.logger.error(`[Daejeon Jubo] 목록 페이지 실패: ${(err as Error).message}`);
      return 0;
    }
  }

  private coerceStr(v: unknown): string {
    if (v == null) return '';
    return String(v).trim();
  }

  private safeDate(raw: unknown): Date | null {
    try {
      const d = new Date(String(raw));
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
