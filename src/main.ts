import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './exception/all-exception-filter';
import { getInstances } from "./util/os-utils";
import { getConfig, startDaemonProcess, exitProcess } from "./util/app-utils";

process.title = 'clkit';
process.on('SIGINT', exitProcess)
process.on('SIGTERM', exitProcess)

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.setGlobalPrefix('api')
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  await app.listen(getConfig().serverPort);
}

bootstrap().then(() => {

  const indexUrl = `http://127.0.0.1:${getConfig().serverPort}`;
  console.log(`server start at : ${indexUrl}`);
  try {
    getInstances().openUrl(indexUrl);
  } catch (error) {
    //ingore    
  }
});

startDaemonProcess();