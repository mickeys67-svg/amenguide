"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const base_scraper_service_1 = require("../scrapers/base-scraper.service");
const ai_refiner_service_1 = require("../scrapers/ai-refiner.service");
let EventsService = EventsService_1 = class EventsService {
    prisma;
    baseScraper;
    aiRefiner;
    logger = new common_1.Logger(EventsService_1.name);
    constructor(prisma, baseScraper, aiRefiner) {
        this.prisma = prisma;
        this.baseScraper = baseScraper;
        this.aiRefiner = aiRefiner;
    }
    async findAll() {
        return this.prisma.event.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.event.findUnique({
            where: { id },
        });
    }
    async scrapeOnDemand(url) {
        try {
            this.logger.log(`On-demand scraping initiated for: ${url}`);
            const html = await this.baseScraper.fetchHtml(url);
            const text = await this.baseScraper.extractText(html);
            const result = await this.aiRefiner.refine(text);
            return {
                ...result,
                originUrl: url,
            };
        }
        catch (error) {
            this.logger.error(`Failed to scrape ${url}: ${error.message}`);
            throw error;
        }
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        base_scraper_service_1.BaseScraperService,
        ai_refiner_service_1.AiRefinerService])
], EventsService);
//# sourceMappingURL=events.service.js.map