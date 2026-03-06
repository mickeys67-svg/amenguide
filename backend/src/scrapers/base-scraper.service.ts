import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { convert } from 'html-to-text';

@Injectable()
export class BaseScraperService {
  private readonly logger = new Logger(BaseScraperService.name);

  async fetchHtml(url: string): Promise<string> {
    const api_key = process.env.SCRAPER_API_KEY;

    // If API key exists, use ScraperAPI for JS rendering and IP rotation
    if (api_key) {
      this.logger.log(`Fetching via Scraping API (with JS rendering) for: ${url}`);
      try {
        const proxyUrl = `http://api.scraperapi.com?api_key=${api_key}&url=${encodeURIComponent(url)}&render=true`;
        const response = await axios.get(proxyUrl, { timeout: 60000 }); // Longer timeout for rendering
        return response.data;
      } catch (error) {
        this.logger.error(`Scraping API failed: ${error.message}. Falling back to direct request.`);
      }
    }

    try {
      this.logger.log(`Fetching HTML directly (No JS rendering) from: ${url}`);
      // ★ arraybuffer로 받아 인코딩 감지 후 디코딩 (EUC-KR 한국 사이트 대응)
      const response = await axios.get(url, {
        timeout: 10000,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      return this.decodeKorean(
        Buffer.from(response.data),
        response.headers['content-type'],
      );
    } catch (error) {
      this.logger.error(`Failed to fetch HTML from ${url}: ${error.message}`);
      throw new Error(`Failed to fetch source: ${error.message}`);
    }
  }

  /** 한국어 HTML 인코딩 감지 및 디코딩 (UTF-8 / EUC-KR / cp949) */
  private decodeKorean(buffer: Buffer, contentType?: string): string {
    const ctLower = (contentType ?? '').toLowerCase();

    const isEucKr =
      ctLower.includes('euc-kr') ||
      ctLower.includes('ks_c_5601') ||
      ctLower.includes('ksc5601') ||
      ctLower.includes('cp949');

    if (isEucKr) {
      try {
        return new TextDecoder('euc-kr').decode(buffer);
      } catch {
        /* fall through to UTF-8 */
      }
    }

    const utf8 = buffer.toString('utf-8');

    // Content-Type 헤더에 없어도 meta charset 으로 감지
    if (
      utf8.toLowerCase().includes('charset=euc-kr') ||
      utf8.toLowerCase().includes('charset=ks_c_5601') ||
      utf8.toLowerCase().includes('charset=cp949')
    ) {
      try {
        return new TextDecoder('euc-kr').decode(buffer);
      } catch {
        /* fall through */
      }
    }

    return utf8;
  }

  async extractText(html: string): Promise<string> {
    try {
      return convert(html, {
        wordwrap: 130,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } },
          { selector: 'img', format: 'skip' },
          { selector: 'nav', format: 'skip' },
          { selector: 'footer', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: '.header', format: 'skip' },
          { selector: '.footer', format: 'skip' },
          { selector: '.navigation', format: 'skip' },
          { selector: '.sidebar', format: 'skip' },
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to extract text from HTML: ${error.message}`);
      throw new Error('Failed to process content');
    }
  }
}
