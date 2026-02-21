import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import axios from 'axios';
import { chromium } from 'playwright';

// Types duplicated from the app to keep the script standalone
interface ScrapingResult {
    title: string;
    date: string;
    location: string;
    aiSummary: string;
    themeColor: string;
}

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function refineWithAi(text: string): Promise<ScrapingResult> {
    const contentForAi = text.slice(0, 8000);
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: `You are an elite Catholic event data analyst.
        Extract event details into JSON:
        - title (string)
        - date (ISO 8601 string)
        - location (string)
        - aiSummary (Korean, 2 sentences)
        - themeColor (Hex code e.g. #E63946 for Ruby, #457B9D for Sapphire, #FFB703 for Amber)`
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
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        const bodyText = await page.innerText('body');

        const result = await refineWithAi(bodyText);

        // Persistence
        const existing = await prisma.event.findFirst({ where: { originUrl: url } });
        if (existing) {
            console.log(`[SCRAPER] Skipping: Already exists.`);
        } else {
            await prisma.event.create({
                data: {
                    title: result.title,
                    date: new Date(result.date),
                    location: result.location,
                    aiSummary: result.aiSummary,
                    themeColor: result.themeColor,
                    originUrl: url,
                    category: '기타'
                }
            });
            console.log(`[SCRAPER] Saved: ${result.title}`);
        }
    } catch (err) {
        console.error(`[SCRAPER] Error processing ${url}:`, err.message);
    } finally {
        await browser.close();
    }
}

async function main() {
    // Example Target URLs - User can modify these or we can fetch them from a "Source" table later
    const targets = [
        'https://www.catholic.or.kr/opencatholic/news/notice',
        'https://www.catholictimes.org/article/article_list.php?cat_number=8',
        'https://www.cpbc.co.kr/CMS/news/list.php?cid=711'
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
        await prisma.$disconnect();
    });
