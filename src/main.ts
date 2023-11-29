import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { exec } from 'child_process';

const listenPort = 28288;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  app.setGlobalPrefix('api')
  await app.listen(listenPort);
}
bootstrap().then(() => {
  const uiUrl = `http://127.0.0.1:${listenPort}`;
  console.log(`server start at : ${uiUrl}`);
  try {
    exec(`start ${uiUrl}`);
  } catch (error) {
    //ingore    
  }
});
