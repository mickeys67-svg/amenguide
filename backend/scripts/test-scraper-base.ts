import { BaseScraperService } from '../src/scrapers/base-scraper.service';
import * as dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testScraper() {
    const scraper = new BaseScraperService();
    // Using a specific event board URL
    const testUrl = 'http://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=mice';




    console.log(`--- TESTING SCRAPER FETCH & EXTRACT ---`);
    console.log(`Target: ${testUrl}`);

    try {
        console.log('1. Fetching HTML...');
        const html = await scraper.fetchHtml(testUrl);
        console.log(`HTML Fetched (${html.length} chars)`);

        console.log('2. Extracting Text...');
        const text = await scraper.extractText(html);
        console.log(`Text Extracted (${text.length} chars)`);
        console.log('--- SAMPLE TEXT (first 500 chars) ---');
        console.log(text.slice(0, 500));
        console.log('------------------------------------');

        if (text.length > 100 && text.includes('가톨릭')) {
            console.log('✅ SCRAPER BASE FUNCTIONALITY VERIFIED.');
        } else {
            console.warn('⚠️ SCRAPER FETCHED CONTENT BUT IT LOOKS EMPTY OR IRRELEVANT.');
        }

    } catch (err) {
        console.error('❌ SCRAPER TEST FAILED:', err.message);
    }
}

testScraper();
