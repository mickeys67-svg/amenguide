import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SemanticSearchService {
    private readonly logger = new Logger(SemanticSearchService.name);
    private openai: OpenAI;

    constructor(private prisma: PrismaService) {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }

    async search(query: string) {
        if (!this.openai) {
            this.logger.warn('Semantic search requested but OpenAI is not configured.');
            // Fallback to simple title search
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
            // 1. Generate embedding for query
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: query,
            });
            const queryEmbedding = embeddingResponse.data[0].embedding;

            // 2. Fetch all events (In production, we would use a vector DB like pgvector)
            // For this prototype, we'll simulate the semantic match with a GPT-4o-mini re-ranker
            // because we don't have embeddings stored in the DB yet.
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

            // Match back to objects
            return events
                .filter(e => rankedIds.includes(e.id))
                .sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id))
                .slice(0, 5);

        } catch (error) {
            this.logger.error(`Semantic search failed: ${error.message}`);
            throw error;
        }
    }
}
