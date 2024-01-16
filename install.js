const path = require('path');
const process = require('child_process');
const fs = require('fs');
const os = require('os');
const config = require('./src/config.json');
const tsconfig = require('./tsconfig.json');
const packageJson = require('./package.json');

const projectRootPath = __dirname;
const distPath = path.join(projectRootPath, tsconfig.compilerOptions.outDir);
const distPjFilePath = path.join(distPath, 'package.json');
const sourcesPath = path.join(projectRootPath, config.sourceDir);
const uiSoucePath = path.join(projectRootPath, config.uiSourceDir);
const uiDistPath = path.join(uiSoucePath, 'dist');
const webUiDirPath = path.join(projectRootPath, config.uiDir);

console.log('===============> UI项目地址: ', config.uiRepos);
console.log('===============> 服务端项目地址：', config.serverRepos);
console.log('===============> 编译路径：', distPath);
console.log('===============> UI源码路径: ', uiSoucePath);

if (!fs.existsSync(sourcesPath)) {
    fs.mkdirSync(sourcesPath, { recursive: true });
}

let needInstall = true;
let needBuild = true;
let needcloneUi = !fs.existsSync(uiSoucePath);

if (fs.existsSync(distPjFilePath)) {
    const dist = JSON.parse(fs.readFileSync(distPjFilePath, 'utf8'));
    const distInstalled = Object.keys(dist.dependencies);
    needInstall = Object.keys(packageJson.dependencies).some(pk => !distInstalled.includes(pk))
    needBuild = packageJson.version !== dist.version;
}

if (needInstall) {
    process.execSync('npm install', { stdio: 'inherit', cwd: projectRootPath });
}

if (needBuild) {
    process.execSync('npm run build', { stdio: 'inherit', cwd: projectRootPath });
}

if (needcloneUi) {
    cloneUi();
    process.execSync(`npm i && npm run build`, { stdio: 'inherit', cwd: uiSoucePath });
    fs.cpSync(uiDistPath, webUiDirPath, { force: true, recursive: true })
}

if (!fs.existsSync(webUiDirPath)) {
    process.execSync(`git pull`, { stdio: 'inherit', cwd: uiSoucePath });
    process.execSync(`npm i && npm run build`, { stdio: 'inherit', cwd: uiSoucePath });
    fs.cpSync(uiDistPath, webUiDirPath, { force: true, recursive: true })
}


fs.cpSync(path.join(projectRootPath, 'init_data', 'db',), path.join(os.homedir(), config.userHomeConfigDir), { force: false, recursive: true })

console.log('installation completed');

function commandAvailable(testCommand) {
    try {
        process.execSync(testCommand, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

function cloneUi() {
    for (const repo of config.uiRepos) {
        try {
            process.execSync(`git clone ${repo}`, { stdio: 'inherit', cwd: sourcesPath });
            return;
        } catch (err) {
            console.error(`git clone ${repo} fail: ${err.message}`);
        }
    }
    throw new Error('clone ui repo error');
}