import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);
  private anthropic: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  async search(query: string) {
    if (!this.anthropic) {
      this.logger.warn('Semantic search requested but ANTHROPIC_API_KEY is not configured.');
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
      const events = await this.prisma.event.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      });

      if (events.length === 0) return [];

      const context = events
        .map((e) => `[ID: ${e.id}] ${e.title}: ${e.aiSummary}`)
        .join('\n');

      const message = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You are a Catholic spiritual guide. Rank the provided events by relevance to the user's query.
Return ONLY the IDs of the top 5 most relevant events, comma-separated. No explanation.
Example: uuid1, uuid2, uuid3`,
        messages: [
          {
            role: 'user',
            content: `Query: "${query}"\n\nEvents:\n${context}`,
          },
        ],
      });

      const block = message.content[0];
      if (block.type !== 'text') return [];

      const rankedIds = block.text
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      return events
        .filter((e) => rankedIds.includes(e.id))
        .sort((a, b) => rankedIds.indexOf(a.id) - rankedIds.indexOf(b.id))
        .slice(0, 5);
    } catch (error) {
      this.logger.error(`Semantic search failed: ${error.message}`);
      return this.prisma.event.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        take: 5,
      });
    }
  }
}
