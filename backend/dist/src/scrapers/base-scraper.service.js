"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BaseScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const html_to_text_1 = require("html-to-text");
let BaseScraperService = BaseScraperService_1 = class BaseScraperService {
    logger = new common_1.Logger(BaseScraperService_1.name);
    async fetchHtml(url) {
        try {
            this.logger.log(`Fetching HTML from: ${url}`);
            const response = await axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch HTML from ${url}: ${error.message}`);
            throw new Error(`Failed to fetch source: ${error.message}`);
        }
    }
    async extractText(html) {
        try {
            return (0, html_to_text_1.convert)(html, {
                wordwrap: 130,
                selectors: [
                    { selector: 'a', options: { ignoreHref: true } },
                    { selector: 'img', format: 'skip' },
                    { selector: 'nav', format: 'skip' },
                    { selector: 'footer', format: 'skip' },
                ],
            });
        }
        catch (error) {
            this.logger.error(`Failed to extract text from HTML: ${error.message}`);
            throw new Error('Failed to process content');
        }
    }
};
exports.BaseScraperService = BaseScraperService;
exports.BaseScraperService = BaseScraperService = BaseScraperService_1 = __decorate([
    (0, common_1.Injectable)()
], BaseScraperService);
//# sourceMappingURL=base-scraper.service.js.map