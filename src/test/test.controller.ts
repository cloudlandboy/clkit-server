import { Controller, Get } from '@nestjs/common';
import { Handlebars } from "../util/template-utils";
import { readFileSync } from 'fs';

@Controller('test')
export class TestController {

    @Get()
    test(): string {
        return "hello world";
    }
}
