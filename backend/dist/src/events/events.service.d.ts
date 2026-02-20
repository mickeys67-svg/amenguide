import { PrismaService } from '../prisma/prisma.service';
import { BaseScraperService } from '../scrapers/base-scraper.service';
import { AiRefinerService } from '../scrapers/ai-refiner.service';
export declare class EventsService {
    private prisma;
    private baseScraper;
    private aiRefiner;
    private readonly logger;
    constructor(prisma: PrismaService, baseScraper: BaseScraperService, aiRefiner: AiRefinerService);
    findAll(): Promise<{
        id: string;
        title: string;
        date: Date | null;
        location: string | null;
        aiSummary: string | null;
        themeColor: string | null;
        latitude: number | null;
        longitude: number | null;
        originUrl: string | null;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        date: Date | null;
        location: string | null;
        aiSummary: string | null;
        themeColor: string | null;
        latitude: number | null;
        longitude: number | null;
        originUrl: string | null;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    scrapeOnDemand(url: string): Promise<{
        originUrl: string;
        title: string;
        date: string;
        location: string;
        aiSummary: string;
        themeColor: string;
    }>;
}
