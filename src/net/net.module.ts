import { Module } from '@nestjs/common';
import { NetService } from './net.service';
import { NetController } from './net.controller';

@Module({
  controllers: [NetController],
  providers: [NetService],
})
export class NetModule {}
