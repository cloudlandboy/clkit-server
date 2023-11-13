import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GithubService } from './github/github.service';
import { execSync } from 'child_process';

@Injectable()
export class AppService {

    constructor(private readonly githubService: GithubService) {
    }

    getCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
        return packageJson.version;
    }

    async checkUpdate() {
        const latestVersion = await this.githubService.getClboyKitServerVersion();
        const currentVersion = this.getCurrentVersion();
        return { latestVersion, currentVersion, updatable: latestVersion !== currentVersion };
    }

    update() {
        const projectPath = join(__dirname, '..');
        execSync('git pull', { cwd: projectPath, encoding: 'utf8' });
        execSync(`node install.js`, { cwd: projectPath, encoding: 'utf8' });
        execSync(`pm2 reload clboy-kit-server`, { cwd: projectPath, encoding: 'utf8' });
    }

}