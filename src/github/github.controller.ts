import { Controller, Get } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) { }

  @Get('clboy_kit_server_version')
  getClboyKitServerVersion(): Promise<string> {
    return this.githubService.getClboyKitServerVersion();
  }
}
