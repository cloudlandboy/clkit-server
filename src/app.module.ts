import { Module } from '@nestjs/common';
import { NetModule } from './net/net.module';
import { WebModule } from './web/web.module';
import { GenModule } from './gen/gen.module';
import { OfficeModule } from './office/office.module';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { TestController } from './test/test.controller';
import { TemplateController } from './gen/template.controller';
import { GithubModule } from './github/github.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReplaceEachRowModule } from './replace-each-row/replace-each-row.module';

@Module({
  imports: [NetModule, WebModule, GenModule, OfficeModule, ConfigModule.forRoot({ isGlobal: true }), DbModule, GithubModule, ReplaceEachRowModule],
  controllers: [TestController, AppController],
  providers: [AppService],
})
export class AppModule { }
