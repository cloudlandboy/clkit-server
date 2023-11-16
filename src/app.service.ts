import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { cpSync, readFileSync } from 'fs';
import { join } from 'path';
import { GithubService } from './github/github.service';
import { execSync } from 'child_process';
import { fileExists } from "./util/file-utils";
import { getConfig, getAppRootPath, getRelativeAppRootPath } from "./util/app-utils";
import { UpdateAppDto } from './common/dto/update-app.dto';

@Injectable()
export class AppService {
    constructor(private readonly githubService: GithubService) {
    }

    getCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(this.getToUsePackageJsonPath(), 'utf8'));
        return packageJson.version;
    }

    getUiCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(getRelativeAppRootPath(getConfig().uiSourceDir, 'package.json'), 'utf8'));
        return packageJson.version;
    }

    async checkUpdate() {
        try {
            const currentVersion = this.getCurrentVersion();
            const uiCurrentVersion = this.getUiCurrentVersion();
            let latestVersion: string = await this.githubService.getClboyKitServerVersion();
            let uiLatestVersion: string = await this.githubService.getClboyKitVersion();
            return {
                latestVersion,
                currentVersion,
                uiCurrentVersion,
                uiLatestVersion,
                serverUpdatable: latestVersion !== currentVersion,
                uiUpdatable: uiCurrentVersion !== uiLatestVersion
            };
        } catch (err) {
            throw new RequestTimeoutException("检查版本更新失败");
        }
    }

    update(dto: UpdateAppDto) {
        if (dto.updateUi) {
            const uiSourcePath = getRelativeAppRootPath(getConfig().uiSourceDir);
            execSync(`git pull`, { stdio: 'inherit', cwd: uiSourcePath });
            execSync(`npm i && npm run build`, { stdio: 'inherit', cwd: uiSourcePath });
            cpSync(join(uiSourcePath, 'dist'), getRelativeAppRootPath(getConfig().uiDir), { force: true, recursive: true })
        }
        if (dto.updateServer) {
            execSync('git pull', { cwd: getAppRootPath(), encoding: 'utf8' });
            execSync(`node install.js`, { cwd: getAppRootPath(), encoding: 'utf8' });
            execSync(`pm2 reload ${getConfig().appName}`, { cwd: getAppRootPath(), encoding: 'utf8' });
        }
    }

    private getToUsePackageJsonPath() {
        const builded = join(__dirname, 'package.json');
        return fileExists(builded) ? builded : getRelativeAppRootPath('package.json');
    }

}