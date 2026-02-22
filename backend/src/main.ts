import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {

  console.log('--- AMENGUIDE BACKEND VERSION: v2.0.1-ROBUST ---');
  const app = await NestFactory.create(AppModule);
  // app.setGlobalPrefix('api/v1'); // Removed for robust legacy alignment
  app.enableCors(); // CORS 허용 (프론트엔드 연동)


  // Failsafe Database Initialization using the actual app service
  const prismaService = app.get(PrismaService);
  try {
    await prismaService.initDatabase();
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
  }



  const port = process.env.PORT ?? 8080;
  console.log(`Application is starting on port ${port}`);
  await app.listen(port);
}
bootstrap();
