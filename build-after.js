const { copyFileSync, writeFileSync, cpSync } = require("fs");
const { join } = require("path");


const distPath = join(__dirname, 'dist');
const ecosystemConfig = {
    apps: [
        {
            name: "clboy-kit-server",
            cwd: "./",
            script: "main.js",
            args: "",
        },
    ],
};

const pm2AppPath = join(__dirname, 'dist_app');
copyFileSync(join(__dirname, 'package.json'), join(pm2AppPath, 'package.json'));
cpSync(distPath, pm2AppPath, { force: true, recursive: true })

const pm2Config = `module.exports=${JSON.stringify(ecosystemConfig)}`
writeFileSync(join(pm2AppPath, 'ecosystem.config.js'), pm2Config, { encoding: 'utf8' });

