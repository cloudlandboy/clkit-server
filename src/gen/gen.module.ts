import { Module } from '@nestjs/common';
import { GenService } from './gen.service';
import { GenController } from './gen.controller';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';

@Module({
  controllers: [GenController, TemplateController],
  providers: [GenService, TemplateService]
})
export class GenModule { }
