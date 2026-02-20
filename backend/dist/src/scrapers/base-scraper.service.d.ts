export declare class BaseScraperService {
    private readonly logger;
    fetchHtml(url: string): Promise<string>;
    extractText(html: string): Promise<string>;
}
