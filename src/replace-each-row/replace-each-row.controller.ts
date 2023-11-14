import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ReplaceEachRowService } from './replace-each-row.service';
import { ReplaceEachRow } from './entities/replace-each-row.entity';

@Controller('replace_each_row')
export class ReplaceEachRowController {
  constructor(private readonly replaceEachRowService: ReplaceEachRowService) {}

  @Post()
  create(@Body() dto: ReplaceEachRow) {
    return this.replaceEachRowService.create(dto);
  }

  @Get()
  findAll() {
    return this.replaceEachRowService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.replaceEachRowService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ReplaceEachRow) {
    return this.replaceEachRowService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.replaceEachRowService.remove(id);
  }
}
