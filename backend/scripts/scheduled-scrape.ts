import { Client } from 'pg';

import OpenAI from 'openai';
import axios from 'axios';
import { convert } from 'html-to-text';
import * as dotenv from 'dotenv';
dotenv.config();

// Types duplicated from the app to keep the script standalone
interface ScrapingResult {
    title: string;
    date: string;
    location: string;
    aiSummary: string;
    themeColor: string;
}

// Delayed initialization to ensure env vars are loaded
let dbClient: Client;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;



async function refineWithAi(text: string, rawHtml?: string): Promise<ScrapingResult> {
    if (!openai) {
        console.log('[AI] No API key found. Using smart fallback from HTML.');

        let titleFallback = "은총의 초대";
        if (rawHtml) {
            const titleMatch = rawHtml.match(/<title>([^<]*)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                titleFallback = titleMatch[1].trim();
            }
        }

        return {
            title: titleFallback,
            date: new Date().toISOString(),
            location: "장소 정보 없음",
            aiSummary: "이 행사에 대한 정보가 곧 업데이트될 예정입니다. 주님의 은총 속에서 평화로운 하루 되세요.",
            themeColor: "#C9A96E"
        };
    }

    const contentForAi = text.slice(0, 8000);
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are an elite Catholic event data analyst and spiritual guide.
        Extract event details into JSON:
        - title (string): Clean, official event name.
        - date (ISO 8601 string): e.g. 2024-05-20T10:00:00.
        - location (string): Name of the church/venue and city.
        - aiSummary (Korean, 2-3 sentences): Use a "warm, welcoming, and spiritually grace-filled tone" (은총이 가득하고 따뜻한 어조). Highlight the spiritual benefit.
        - themeColor (Hex code e.g. #E63946 for Ruby, #457B9D for Sapphire, #FFB703 for Amber, #06D6A0 for Emerald)`
            },

            {
                role: 'user',
                content: `Raw Text:\n\n${contentForAi}`
            }
        ],
        response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('AI returned no data.');
    return JSON.parse(content) as ScrapingResult;
}

async function scrapeUrl(url: string) {
    console.log(`[SCRAPER] Processing: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 10000
        });

        const bodyText = convert(response.data, {
            wordwrap: 130,
            selectors: [
                { selector: 'a', options: { ignoreHref: true } },
                { selector: 'img', format: 'skip' },
                { selector: 'nav', format: 'skip' },
                { selector: 'footer', format: 'skip' },
                { selector: 'script', format: 'skip' },
                { selector: 'style', format: 'skip' },
            ]
        });

        const result = await refineWithAi(bodyText, response.data);


        // Persistence
        const existing = await dbClient.query('SELECT id FROM "Event" WHERE "originUrl" = $1 LIMIT 1', [url]);

        if (existing.rowCount && existing.rowCount > 0) {
            console.log(`[SCRAPER] Skipping: Already exists.`);
        } else {
            await dbClient.query(
                'INSERT INTO "Event" (id, title, date, location, "aiSummary", "themeColor", "originUrl", category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [
                    Math.random().toString(36).substring(2, 15),
                    result.title,
                    new Date(result.date),
                    result.location,
                    result.aiSummary,
                    result.themeColor,
                    url,
                    '기타'
                ]
            );
            console.log(`[SCRAPER] Saved: ${result.title}`);
        }
    } catch (err) {
        console.error(`[SCRAPER] Error processing ${url}:`, err.message);
    }
}

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined in environment variables.');
    }

    console.log('[SCRAPER] Initializing DB connection...');
    console.log('[SCRAPER] DB URL host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
    dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    });

    await dbClient.connect();

    // Cleanup fake/placeholder data before starting
    console.log('[CLEANUP] Removing placeholder records...');
    await dbClient.query('DELETE FROM "Event" WHERE title LIKE \'%수정 필요%\' OR title = \'은총의 초대\'');


    // Example Target URLs

    const targets = [
        'https://www.catholictimes.org/article/20260210500006', // 은총의 사순 시기
        'https://www.catholictimes.org/article/20260215500003', // 교황 사순 담화
        'http://bbs.catholic.or.kr/bbs/bbs_list.asp?menu=mice',
    ];





    for (const url of targets) {
        try {
            await scrapeUrl(url);
        } catch (e) {
            console.error(`Failed to scrape ${url}:`, e);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await dbClient.end();
    });

