import { PrismaService } from '../prisma/prisma.service';
export declare class SemanticSearchService {
    private prisma;
    private readonly logger;
    private openai;
    constructor(prisma: PrismaService);
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
}
