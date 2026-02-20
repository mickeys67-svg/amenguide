import { ScrapingResult } from './interfaces/scraping-result.interface';
export declare class AiRefinerService {
    private readonly logger;
    private openai;
    constructor();
    refine(text: string): Promise<ScrapingResult>;
    private validateResult;
}
