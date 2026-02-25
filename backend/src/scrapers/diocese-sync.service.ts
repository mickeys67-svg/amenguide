import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { convert } from 'html-to-text';
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
}

export interface DioceseSyncResult {
  busan: number;
  daegu: number;
  daejeon: number;
  total: number;
}

// ─── 카테고리 → 색상 매핑 (SANCTUS 디자인 시스템 — UI와 동일) ────────────────
const CATEGORY_COLOR: Record<string, string> = {
  피정: '#1B4080',  // deep blue
  미사: '#8B1A1A',  // deep crimson (전례색)
  강의: '#1A6B40',  // forest green
  순례: '#7B5230',  // warm brown
  청년: '#0B6B70',  // deep teal
  문화: '#6E2882',  // royal purple
  선교: '#C83A1E',  // vermillion
};

@Injectable()
export class DioceseSyncService {
  private readonly logger = new Logger(DioceseSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── 전체 교구 순차 실행 ─────────────────────────────────────────────────
  async runAll(monthsAhead = 3): Promise<DioceseSyncResult> {
    this.logger.log(`[DioceseSync] 시작 — 앞으로 ${monthsAhead}개월 수집`);

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

    const daejeon = await this.runDaejeon(monthsAhead).catch((e) => {
      this.logger.error(`[Daejeon] 전체 실패: ${e.message}`);
      return 0;
    });

    const result: DioceseSyncResult = {
      busan,
      daegu,
      daejeon,
      total: busan + daegu + daejeon,
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
    const url = `https://catholicbusan.or.kr/news/schedule/schedule?date=${date}&type=month`;
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

    // 응답이 배열이거나 {schedule: [...]} 형태 모두 대응
    const items: any[] = Array.isArray(body)
      ? body
      : (body?.schedule ?? body?.data ?? body?.items ?? body?.list ?? []);

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
      },
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
    //   href 에 view / idx= / no= / seq= 가 있고, 텍스트가 한국어인 링크
    const linkRe =
      /href="([^"]*(?:news_view|board_view|view|detail|read|idx=|no=|seq=)[^"]*)"[^>]*>\s*((?:[가-힣a-zA-Z0-9\s·\-·「」『』《》<>〈〉【】\[\]\/()（）%&!?,.·…]{3,80}?))\s*<\/a>/gi;

    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1].trim();
      const rawTitle = m[2].trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

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
          date: new Date(year, month - 1, 1),
          location: '대구대교구',
          originUrl: `https://daegu-archdiocese.or.kr/page/news.html?srl=schedule&nYear=${year}&nMonth=${month}`,
          category,
          themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
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
    const url = `http://www.djcatholic.or.kr/home/news/monthplan.php?pg=${page}`;
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
    const linkRe =
      /href="([^"]*(?:enter=v|view|read|plan_view|monthplan_view|wr_id=)[^"]*(?:idx=|wr_id=)\d+[^"]*)"[^>]*>\s*((?:[가-힣a-zA-Z0-9\s·\-「」]{3,80}?))\s*<\/a>/gi;

    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const href = m[1].trim();
      const rawTitle = m[2].trim().replace(/&amp;/g, '&').replace(/\s+/g, ' ');

      if (!rawTitle || seen.has(rawTitle)) continue;
      if (rawTitle.length < 3 || /^\d+$/.test(rawTitle)) continue;
      if (['목록', '검색', '이전', '다음'].includes(rawTitle)) continue;

      seen.add(rawTitle);

      const originUrl = href.startsWith('http')
        ? href
        : `http://www.djcatholic.or.kr${href.startsWith('/') ? '' : '/'}${href}`;

      // 날짜: 링크 주변 텍스트에서 YYYY-MM-DD 또는 YYYY.MM.DD 탐색
      const surroundingText = html.slice(
        Math.max(0, m.index - 300),
        m.index + 300,
      );
      const dateMatch = surroundingText.match(
        /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/,
      );
      const date = dateMatch
        ? new Date(
            parseInt(dateMatch[1]),
            parseInt(dateMatch[2]) - 1,
            parseInt(dateMatch[3]),
          )
        : new Date();

      const category = this.detectCategory(rawTitle, '');
      events.push({
        title: rawTitle,
        date,
        location: '대전교구',
        originUrl,
        category,
        themeColor: CATEGORY_COLOR[category] ?? '#C9A96E',
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
    // 중복 체크: originUrl 우선, 없으면 title+date 조합 (title 단독 체크는 연간 반복 행사를 영구 차단하는 버그)
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
      dupWhere = { title: evt.title };
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
      },
    });

    this.logger.log(
      `${prefix} ✅ 저장: "${evt.title}" [${evt.category}] @ ${evt.location}`,
    );
    return true;
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

  /** 카테고리 탐지 — UI 7카테고리와 동일한 분류체계 */
  private detectCategory(title: string, type: string): string {
    const t = (title + ' ' + type).replace(/\s+/g, '');
    if (/피정|영성수련|묵상|성령쇄신|마리아의밤/.test(t)) return '피정';
    if (/미사|전례|기도회|성시간|연도|위령|성체거양|강론|복사단/.test(t)) return '미사';
    if (/강의|강좌|교육|특강|세미나|렉시오|성경|교리|신학/.test(t)) return '강의';
    if (/순례|성지|도보순례|성당탐방|순례길/.test(t)) return '순례';
    if (/청년|Youth|youth|대학|청소년|성소/.test(t)) return '청년';
    if (/음악회|공연|전시|합창|연극|음악제|뮤지컬|콘서트|축제/.test(t)) return '문화';
    if (/선교|봉사|레지오|복음화|사회사목|자선/.test(t)) return '선교';
    return '선교'; // 분류 불가 → 선교/기타로 처리 (기타 카테고리 제거)
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
