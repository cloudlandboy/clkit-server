import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { DbService } from './db.service';
import { Db } from './entities/db.entity';

@Controller('db')
export class DbController {
  constructor(private readonly dbService: DbService) { }

  @Post()
  create(@Body() dto: Db) {
    return this.dbService.create(dto);
  }

  @Get()
  findAll() {
    return this.dbService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.dbService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Db) {
    return this.dbService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dbService.remove(id);
  }

  @Get('/query_table/:id')
  queryTable(@Param('id') id: string, @Query('keyword') keyword: string) {
    return this.dbService.queryTable(id, keyword);
  }
}
