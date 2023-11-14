import { Module } from '@nestjs/common';
import { ReplaceEachRowService } from './replace-each-row.service';
import { ReplaceEachRowController } from './replace-each-row.controller';

@Module({
  controllers: [ReplaceEachRowController],
  providers: [ReplaceEachRowService],
})
export class ReplaceEachRowModule {}
