import { Module } from '@nestjs/common';
import { GenService } from './gen.service';
import { GenController } from './gen.controller';
import { DbService } from 'src/db/db.service';

@Module({
  controllers: [GenController],
  providers: [GenService]
})
export class GenModule { }
