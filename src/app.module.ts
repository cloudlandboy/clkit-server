import { Global, Module } from '@nestjs/common';
import { NetModule } from './net/net.module';
import { WebModule } from './web/web.module';
import { GenModule } from './gen/gen.module';
import { OfficeModule } from './office/office.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { TestController } from './test/test.controller';

@Module({
  imports: [NetModule, WebModule, GenModule, OfficeModule, ConfigModule.forRoot({ isGlobal: true }), DbModule],
  controllers: [TestController],
})
export class AppModule { }
