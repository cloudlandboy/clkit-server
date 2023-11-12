import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { DbController } from './db.controller';
import { DbLangTypeModule } from './db-lang-type/db-lang-type.module';
import { DbLangTypeService } from './db-lang-type/db-lang-type.service';

@Global()
@Module({
  controllers: [DbController],
  providers: [DbService],
  exports: [DbService],
  imports: [DbLangTypeModule]
})
export class DbModule { }
