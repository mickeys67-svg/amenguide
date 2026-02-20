import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // CORS 허용 (프론트엔드 연동)
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
