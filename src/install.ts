import { join } from "path";
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

const projectRootPath = join(__dirname, '..');
const distPath = join(projectRootPath, 'dist');
const distPjFilePath = join(distPath, 'package.json');

function commandAvailable(testCommand: string): boolean {
    try {
        execSync(testCommand, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

if (!commandAvailable('pm2 --version')) {
    console.log('准备安装pm2');
    execSync('npm install -g pm2', { encoding: 'utf8', stdio: 'inherit' });
    console.log('pm2安装成功!');
}

let needInstall = true;
let needBuild = true;

if (existsSync(distPjFilePath)) {
    const dist = JSON.parse(readFileSync(distPjFilePath, 'utf8'));
    const distInstalled = Object.keys(dist.dependencies);
    const current = JSON.parse(readFileSync(join(projectRootPath, 'package.json'), 'utf8'));
    needInstall = Object.keys(current.dependencies).some(pk => !distInstalled.includes(pk))
    needBuild = current.version !== dist.version;
}

if (needInstall) {
    execSync('npm install', { stdio: 'inherit', cwd: projectRootPath });
}

if (needBuild) {
    execSync('npm run build', { stdio: 'inherit', cwd: projectRootPath });
}


