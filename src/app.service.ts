import { Injectable } from '@nestjs/common';
import { cpSync, readFileSync } from 'fs';
import { join } from 'path';
import { GithubService } from './github/github.service';
import { execSync } from 'child_process';
import { fileExists } from "./util/file-utils";
import * as appConfig from "./config.json";
import { UpdateAppDto } from './common/dto/update-app.dto';

@Injectable()
export class AppService {
    private projectRootPath: string;
    constructor(private readonly githubService: GithubService) {
        this.projectRootPath = join(__dirname, '..');
    }

    getCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(this.getToUsePackageJsonPath(), 'utf8'));
        return packageJson.version;
    }

    getUiCurrentVersion(): string {
        console.log(appConfig);

        const packageJson = JSON.parse(readFileSync(join(this.projectRootPath, appConfig.uiSourceDir, 'package.json'), 'utf8'));
        return packageJson.version;
    }

    async checkUpdate() {
        const currentVersion = this.getCurrentVersion();
        const uiCurrentVersion = this.getUiCurrentVersion();

        let latestVersion: string;
        let uiLatestVersion: string;
        const asyncTasks = [
            this.githubService.getClboyKitServerVersion().then(v => {
                latestVersion = v;
            }),
            this.githubService.getClboyKitVersion().then(v => {
                uiLatestVersion = v
            })
        ];

        await Promise.all(asyncTasks);

        return {
            latestVersion,
            currentVersion,
            uiCurrentVersion,
            uiLatestVersion,
            serverUpdatable: latestVersion !== currentVersion,
            uiUpdatable: uiCurrentVersion !== uiLatestVersion
        };
    }

    update(dto: UpdateAppDto) {
        if (dto.updateUi) {
            const uiSourcePath = join(this.projectRootPath, appConfig.uiSourceDir);
            execSync(`git pull`, { stdio: 'inherit', cwd: uiSourcePath });
            execSync(`npm i && npm run build`, { stdio: 'inherit', cwd: uiSourcePath });
            cpSync(join(uiSourcePath, 'dist'), join(this.projectRootPath, appConfig.uiDir), { force: true, recursive: true })
        }
        if (dto.updateServer) {
            execSync('git pull', { cwd: this.projectRootPath, encoding: 'utf8' });
            execSync(`node install.js`, { cwd: this.projectRootPath, encoding: 'utf8' });
            execSync(`pm2 reload ${appConfig.appName}`, { cwd: this.projectRootPath, encoding: 'utf8' });
        }
    }

    private getToUsePackageJsonPath() {
        const builded = join(__dirname, 'package.json');
        return fileExists(builded) ? builded : join(this.projectRootPath, 'package.json');
    }

}