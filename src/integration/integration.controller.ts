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
}
