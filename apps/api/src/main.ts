import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:3000' });

  const port = app.get(ConfigService).get<number>('PORT', 3001);
  await app.listen(port);
}
bootstrap();
