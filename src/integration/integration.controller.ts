/**
 * $1
 * @author: clboy
 * @date: 2023-12-05 20:51:19
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { Integration } from './entities/integration.entity';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) { }

  @Post()
  create(@Body() dto: Integration) {
    return this.integrationService.create(dto);
  }

  @Get()
  findAll() {
    return this.integrationService.findAll();
  }

  @Get('tree')
  getTree() {
    return this.integrationService.getTree(false);
  }

  @Get('installed_tree')
  getInstalledTree() {
    return this.integrationService.getTree(true);
  }

  @Get('installed')
  findAllInstalled(): Promise<Integration[]> {
    return this.integrationService.findAllInstalled();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.integrationService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Integration) {
    return this.integrationService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.integrationService.remove(id);
  }

  @Post('/install/:id')
  install(@Param('id') id: string) {
    return this.integrationService.install(id);
  }
}
