"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const projectRootPath = __dirname;
const distPath = (0, path_1.join)(projectRootPath, 'dist');
const distPjFilePath = (0, path_1.join)(distPath, 'package.json');
function commandAvailable(testCommand) {
    try {
        (0, child_process_1.execSync)(testCommand, { stdio: 'ignore' });
        return true;
    }
    catch (error) {
        return false;
    }
}
if (!commandAvailable('pm2 --version')) {
    console.log('准备安装pm2');
    (0, child_process_1.execSync)('npm install -g pm2', { encoding: 'utf8', stdio: 'inherit' });
    console.log('pm2安装成功!');
}
let needInstall = true;
let needBuild = true;
if ((0, fs_1.existsSync)(distPjFilePath)) {
    const dist = JSON.parse((0, fs_1.readFileSync)(distPjFilePath, 'utf8'));
    const distInstalled = Object.keys(dist.dependencies);
    const current = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(projectRootPath, 'package.json'), 'utf8'));
    needInstall = Object.keys(current.dependencies).some(pk => !distInstalled.includes(pk));
    needBuild = current.version !== dist.version;
}
if (needInstall) {
    (0, child_process_1.execSync)('npm install', { stdio: 'inherit', cwd: projectRootPath });
}
if (needBuild) {
    (0, child_process_1.execSync)('npm run build', { stdio: 'inherit', cwd: projectRootPath });
}
(0, fs_1.cpSync)((0, path_1.join)(projectRootPath, 'init_data', 'db'), (0, path_1.join)((0, os_1.homedir)(), '.clboy-kit'), { force: false, recursive: true });