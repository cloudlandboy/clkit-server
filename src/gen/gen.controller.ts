import { Body, Controller, Delete, Get, HttpException, Param, Post, Put, Query, Res, StreamableFile } from '@nestjs/common';
import { GenService } from './gen.service';
import { GenCrudDto } from './dto/gen-crud.dto';
import { Response } from 'express';

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
  
}
