import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CrudTemplate } from './entities/crud-template.entity';
import { TemplateService } from './template.service';

@Controller('gen/template')
export class TemplateController {

    constructor(private readonly templateService: TemplateService) {
    }

    @Post()
    create(@Body() template: CrudTemplate): Promise<CrudTemplate> {
        return this.templateService.create(template);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() template: CrudTemplate): Promise<CrudTemplate> {
        return this.templateService.update(id, template);
    }

    @Delete(':id')
    remove(@Param('id') id: string): Promise<boolean> {
        return this.templateService.remove(id);
    }

    @Get()
    findByLanguage(@Query('language') language: string): Promise<CrudTemplate[]> {
        return this.templateService.findByLanguage(language);
    }

    @Put('unlock/:id')
    unlock(@Param('id') id: string): Promise<boolean> {
        return this.templateService.unlock(id);
    }
}
