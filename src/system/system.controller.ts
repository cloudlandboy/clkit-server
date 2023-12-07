/**
 * 系统Controller
 * @author: clboy
 * @date: 2023-12-06 10:45:02
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
import { Controller, Get, Header, Res } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) { }

  @Header('Content-Type', 'application/javascript')
  @Header('Content-Disposition', 'attachment; filename=dict.constants.js')
  @Get('download_dict_const_js')
  downloadDictConstJs() {
    return this.systemService.downloadDictConstJs();
  }
}
