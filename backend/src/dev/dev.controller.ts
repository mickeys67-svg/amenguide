import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('dev')
export class DevController {
  private readonly logger = new Logger(DevController.name);

  constructor(private prisma: PrismaService) { }

  @Get('reset-all')
  async resetAll() {
    this.logger.log('Development reset-all requested.');
    try {
      // Drop tables for a clean state
      const tables = ['Bookmark', 'Event', 'User'];
      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(
          `DROP TABLE IF EXISTS "${table}" CASCADE;`,
        );
      }

      // Unified Re-initialization
      await this.prisma.initDatabase();


      return {
        success: true,
        message: 'All tables reset and re-initialized successfully.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Reset failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
