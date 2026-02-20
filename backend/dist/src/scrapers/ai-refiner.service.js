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
var AiRefinerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRefinerService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = __importDefault(require("openai"));
let AiRefinerService = AiRefinerService_1 = class AiRefinerService {
    logger = new common_1.Logger(AiRefinerService_1.name);
    openai;
    constructor() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        else {
            this.logger.warn('OPENAI_API_KEY is missing. AI refinement will be unavailable.');
        }
    }
    async refine(text) {
        if (!this.openai) {
            throw new Error('AI service is not configured (missing API key).');
        }
        const contentForAi = text.slice(0, 8000);
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
            if (!content)
                throw new Error('AI returned no data.');
            const result = JSON.parse(content);
            this.validateResult(result);
            return result;
        }
        catch (error) {
            this.logger.error(`Precision extraction failed: ${error.message}`);
            throw new Error(`Data refinement error: ${error.message}`);
        }
    }
    validateResult(data) {
        const required = ['title', 'date', 'location', 'aiSummary', 'themeColor'];
        for (const field of required) {
            if (!data[field] || typeof data[field] !== 'string') {
                throw new Error(`Missing or invalid field: ${field}`);
            }
        }
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.date)) {
            this.logger.warn(`AI returned non-ISO date: ${data.date}. Attempting to fix...`);
        }
    }
};
exports.AiRefinerService = AiRefinerService;
exports.AiRefinerService = AiRefinerService = AiRefinerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiRefinerService);
//# sourceMappingURL=ai-refiner.service.js.map