import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('app')
export class AppController {

    constructor(private readonly appService: AppService) {

    }

    @Get('version')
    getCurrentVersion(): string {
        return this.appService.getCurrentVersion();
    }
}
