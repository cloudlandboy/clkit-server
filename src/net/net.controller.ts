import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { NetService } from './net.service';
import { ScanLanIpVo } from './vo/scan-lan-Ip.vo';
import { ScanLanIpQuery } from './query/san-lan-ip.query';
import { PidInfo } from 'src/util/os-utils';

@Controller('net')
export class NetController {
  constructor(private readonly netService: NetService) {
  }

  @Get('lan_ip')
  getLanIp(): string[] {
    return this.netService.getLanIp();
  }

  @Get('scan_lan_ip')
  async scanLanIp(@Query() query: ScanLanIpQuery): Promise<ScanLanIpVo[]> {
    return this.netService.scanLanIp(query);
  }

  @Get('find_pid')
  findPid(@Query('type') type: string, @Query('value') value: number | string): PidInfo[] {
    return this.netService.findPid(type, value);
  }

  @Post('kill_pid')
  killPid(@Body('pid') pid: number): boolean {
    return this.netService.killPid(pid);
  }

  @Post('kill_port')
  killPort(@Body('port') port: number): boolean {
    return this.netService.killPort(port);
  }
}
