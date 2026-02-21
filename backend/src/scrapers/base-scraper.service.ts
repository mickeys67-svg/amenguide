import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { convert } from 'html-to-text';

@Injectable()
export class BaseScraperService {
  private readonly logger = new Logger(BaseScraperService.name);

  async fetchHtml(url: string): Promise<string> {
    try {
      this.logger.log(`Fetching HTML from: ${url}`);
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch HTML from ${url}: ${error.message}`);
      throw new Error(`Failed to fetch source: ${error.message}`);
    }
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
        ],
      });
    } catch (error) {
      this.logger.error(`Failed to extract text from HTML: ${error.message}`);
      throw new Error('Failed to process content');
    }
  }
}
