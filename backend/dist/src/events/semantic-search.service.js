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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SemanticSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticSearchService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
let SemanticSearchService = SemanticSearchService_1 = class SemanticSearchService {
    prisma;
    logger = new common_1.Logger(SemanticSearchService_1.name);
    openai;
    constructor(prisma) {
        this.prisma = prisma;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }
    async search(query) {
        if (!this.openai) {
            this.logger.warn('Semantic search requested but OpenAI is not configured.');
            return this.prisma.event.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { aiSummary: { contains: query, mode: 'insensitive' } },
                    ],
                },
            });
        }
        try {
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;
            const events = await this.prisma.event.findMany();
            const context = events.map(e => `[ID: ${e.id}] ${e.title}: ${e.aiSummary}`).join('\n');
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a spiritual guide. Based on the user's spiritual need: "${query}", 
            rank the following events by relevance. Return ONLY a comma-separated list of IDs in order of relevance.`,
                    },
                    {
                        role: 'user',
                        content: context,
                    },
                ],
            });
            const rankedIds = completion.choices[0].message.content?.split(',').map(id => id.trim()) || [];
            return events
                .filter(e => rankedIds.includes(e.id))
                .sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id))
                .slice(0, 5);
        }
        catch (error) {
            this.logger.error(`Semantic search failed: ${error.message}`);
            throw error;
        }
    }
};
exports.SemanticSearchService = SemanticSearchService;
exports.SemanticSearchService = SemanticSearchService = SemanticSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SemanticSearchService);
//# sourceMappingURL=semantic-search.service.js.map