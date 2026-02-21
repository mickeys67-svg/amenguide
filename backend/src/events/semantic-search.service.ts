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
      this.logger.warn(
        'Semantic search requested but OpenAI is not configured.',
      );
      return this.prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { aiSummary: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 10,
      });
    }

    try {
      // 1. Fetch all events for re-ranking (Simplified for prototype)
      // Note: In production, we'd use pgvector/embeddings query
      const events = await this.prisma.event.findMany({
        take: 50, // Limit to recent 50 for re-ranking performance
        orderBy: { createdAt: 'desc' },
      });

      if (events.length === 0) return [];

      const context = events
        .map((e) => `[ID: ${e.id}] ${e.title}: ${e.aiSummary}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a Catholic spiritual guide. The user is looking for: "${query}".
                        Rank the provided events by relevance to their spiritual need. 
                        Return ONLY the IDs of the top 5 most relevant events, separated by commas. 
                        Example output: uuid1, uuid2, uuid3`,
          },
          {
            role: 'user',
            content: `Events list:\n${context}`,
          },
        ],
        temperature: 0, // Lower temperature for more deterministic output
      });

      const rawContent = completion.choices[0].message.content || '';
      const rankedIds = rawContent
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      // Re-order based on AI ranking
      const results = events
        .filter((e) => rankedIds.includes(e.id))
        .sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id));

      return results.slice(0, 5);
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      // Graceful fallback to simple search on error
      return this.prisma.event.findMany({
        where: {
          OR: [{ title: { contains: query, mode: 'insensitive' } }],
        },
        take: 5,
      });
    }
  }
}
