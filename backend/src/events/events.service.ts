import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { convert } from 'html-to-text';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

import { BaseScraperService } from '../scrapers/base-scraper.service';
import { AiRefinerService } from '../scrapers/ai-refiner.service';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        private prisma: PrismaService,
        private baseScraper: BaseScraperService,
        private aiRefiner: AiRefinerService
    ) { }

    async findAll() {
        return this.prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.event.findUnique({
            where: { id },
        });
    }

    async scrapeOnDemand(url: string) {
        try {
            this.logger.log(`On-demand scraping initiated for: ${url}`);

            // 1. Fetch HTML
            const html = await this.baseScraper.fetchHtml(url);

            // 2. Extract Text
            const text = await this.baseScraper.extractText(html);

            // 3. AI Refinement
            const result = await this.aiRefiner.refine(text);

            return {
                ...result,
                originUrl: url,
            };
        } catch (error) {
            this.logger.error(`Failed to scrape ${url}: ${error.message}`);
            throw error;
        }
    }
}
