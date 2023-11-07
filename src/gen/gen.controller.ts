import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, Res, StreamableFile } from '@nestjs/common';
import { GenService } from './gen.service';
import { GenCrudDto } from './dto/gen-crud.dto';
import { Response } from 'express';
import { CrudTemplate } from './entities/crud-template.entity';

@Controller('gen')
export class GenController {
  constructor(private readonly genService: GenService) { }

  @Post('crud')
  genCrud(@Body() dto: GenCrudDto, @Res() res: Response) {
    this.genService.genCrud(dto, res).catch(err => {
      if (err instanceof HttpException) {
        res.status(err.getStatus());
        res.json(err.getResponse());
      } else {
        res.status(500);
        res.end();
      }
    });
  }

  @Post('template')
  saveTemplate(@Body() template: CrudTemplate): Promise<CrudTemplate> {
    return this.genService.saveTemplate(template);
  }

  @Put('template/:id')
  updateTemplate(@Param('id') id: string, @Body() template: CrudTemplate): Promise<CrudTemplate> {
    return this.genService.updateTemplate(id, template);
  }

  @Delete('template/:id')
  removeTemplate(@Param('id') id: string): Promise<boolean> {
    return this.genService.removeTemplate(id);
  }

  @Get('template')
  findTemplate(@Query('language') language: string): Promise<CrudTemplate[]> {
    return this.genService.findTemplate(language);
  }

  @Put('template/unlock/:id')
  unlockTemplate(@Param('id') id: string): Promise<boolean> {
    return this.genService.unlockTemplate(id);
  }
}
