import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('app')
export class AppController {

    constructor(private readonly appService: AppService) {

    }

    @Get('version')
    getCurrentVersion(): string {
        return this.appService.getCurrentVersion();
    }

    @Get('check_update')
    checkUpdate() {
        return this.appService.checkUpdate();
    }

    @Post('update')
    update() {
        return this.appService.update();
    }
}