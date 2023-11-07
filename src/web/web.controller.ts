import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WebService } from './web.service';
import { ProxyRequestDto } from './dto/proxy-request.dto';

@Controller('web')
export class WebController {
  constructor(private readonly webService: WebService) { }

  @Post('proxy_request')
  proxyRequest(@Body() dto: ProxyRequestDto) {
    return this.webService.proxyRequest(dto);
  }

}
