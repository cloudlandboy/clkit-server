import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GithubService } from './github/github.service';
import { execSync } from 'child_process';
import { fileExists } from "./util/file-utils";

@Injectable()
export class AppService {

    constructor(private readonly githubService: GithubService) {
    }

    getCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(this.getToUsePackageJsonPath(), 'utf8'));
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

    private getToUsePackageJsonPath() {
        const builded = join(__dirname, 'package.json');
        return fileExists(builded) ? builded : join(__dirname, '..', 'package.json');
    }

}