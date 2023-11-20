import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { DbLangTypeService } from './db-lang-type.service';
import { DbLangType } from './entities/db-lang-type.entity';

@Controller('db_lang_type')
export class DbLangTypeController {
  constructor(private readonly dbLangTypeService: DbLangTypeService) { }

  @Post()
  create(@Body() dto: DbLangType) {
    return this.dbLangTypeService.create(dto);
  }

  @Get()
  findAll() {
    return this.dbLangTypeService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.dbLangTypeService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: DbLangType) {
    return this.dbLangTypeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dbLangTypeService.remove(id);
  }

  @Post('unlock/:id')
  unlock(@Param('id') id: string) {
    return this.dbLangTypeService.unlock(id);
  }
}
