import { EventsService } from './events.service';
import { SemanticSearchService } from './semantic-search.service';
export declare class EventsController {
    private readonly eventsService;
    private readonly semanticSearch;
    constructor(eventsService: EventsService, semanticSearch: SemanticSearchService);
    findAll(): Promise<{
        id: string;
        title: string;
        date: Date | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        originUrl: string | null;
        aiSummary: string | null;
        themeColor: string | null;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    search(query: string): Promise<{
        id: string;
        title: string;
        date: Date | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        originUrl: string | null;
        aiSummary: string | null;
        themeColor: string | null;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    scrape(url: string): Promise<{
        originUrl: string;
        title: string;
        date: string;
        location: string;
        aiSummary: string;
        themeColor: string;
    }>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        date: Date | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        originUrl: string | null;
        aiSummary: string | null;
        themeColor: string | null;
        category: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
