import { Global, Module } from '@nestjs/common';
import { DbLangTypeService } from './db-lang-type.service';
import { DbLangTypeController } from './db-lang-type.controller';

@Global()
@Module({
  controllers: [DbLangTypeController],
  providers: [DbLangTypeService],
  exports: [DbLangTypeService]
})
export class DbLangTypeModule { }
