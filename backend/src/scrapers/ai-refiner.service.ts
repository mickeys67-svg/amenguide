import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ScrapingResult } from './interfaces/scraping-result.interface';

@Injectable()
export class AiRefinerService {
    private readonly logger = new Logger(AiRefinerService.name);
    private openai: OpenAI;

    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        } else {
            this.logger.warn('OPENAI_API_KEY is missing. AI refinement will be unavailable.');
        }
    }

    async refine(text: string): Promise<ScrapingResult> {
        if (!this.openai) {
            throw new Error('AI service is not configured (missing API key).');
        }

        const contentForAi = text.slice(0, 8000); // 넉넉한 초기 텍스트 제공

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an elite Catholic event data analyst.
            Your mission is to extract precise event details from the raw text provided.
            
            OUTPUT RULES:
            1. Language: Use Korean for 'aiSummary'.
            2. JSON Structure: Return ONLY a JSON object with fields: 
               - title (string): Clean, official event name.
               - date (string): STRICT ISO 8601 (YYYY-MM-DDTHH:mm:ss). If specific time is unknown, use 00:00:00.
               - location (string): Name of the church/venue and city.
               - aiSummary (string): 2 meaningful sentences in a warm, inviting tone.
               - themeColor (string): Hex code matching a stained glass palette (e.g., #E63946 for Ruby, #457B9D for Sapphire, #FFB703 for Amber).
            3. Precision: If the date is not found, DO NOT make it up, use "1970-01-01T00:00:00".`,
                    },
                    {
                        role: 'user',
                        content: `Raw Text Chunk:\n\n${contentForAi}`,
                    },
                ],
                response_format: { type: 'json_object' },
            });

            const content = completion.choices[0].message.content;
            if (!content) throw new Error('AI returned no data.');

            const result = JSON.parse(content) as ScrapingResult;

            // Manual Validation Layer (Spaghetti prevention via direct checks)
            this.validateResult(result);

            return result;
        } catch (error) {
            this.logger.error(`Precision extraction failed: ${error.message}`);
            throw new Error(`Data refinement error: ${error.message}`);
        }
    }

    private validateResult(data: any): void {
        const required = ['title', 'date', 'location', 'aiSummary', 'themeColor'];
        for (const field of required) {
            if (!data[field] || typeof data[field] !== 'string') {
                throw new Error(`Missing or invalid field: ${field}`);
            }
        }
        // Date format sanity check
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.date)) {
            this.logger.warn(`AI returned non-ISO date: ${data.date}. Attempting to fix...`);
        }
    }
}
