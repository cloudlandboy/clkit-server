import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ProxyRequestDto } from './dto/proxy-request.dto';

@Injectable()
export class WebService {

  proxyRequest(dto: ProxyRequestDto) {
    axios.request({
      url: dto.url,
      method: dto.method,
      headers: dto.heraders,
      data: dto.body
    })
  }
}
