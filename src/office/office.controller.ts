import { Body, Controller, Get, Post, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { OfficeService } from './office.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) { }


  @Post('convert')
  @UseInterceptors(FileInterceptor('file'))
  async convert(@Body() dto: any, @UploadedFile() file: Express.Multer.File, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    return this.officeService.convert(dto, file, res);
  }

  @Get('list_support_file_type')
  listSupportFileType() {
    return this.officeService.listSupportFileType();
  }
}
