const { join } = require('path');
const { createWriteStream } = require('fs');
const { spawn } = require('child_process');
const { argv } = require('process');
const config = require('./src/config.json');
const axios = require('axios');

function start() {
    const process = spawn(`node`, ['./dist/main.js'],
        {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
            cwd: __dirname
        });

    process.unref();
}

function stop() {
    axios.post(`http://127.0.0.1:${config.serverPort}/api/app/stop`).catch(err => {
        //ignore
    })
}

const comma = argv[2];
switch (comma) {
    case 'stop':
        stop();
        break;
    case 'start':
        start();
        break;
    default:
}

module.exports = { start, stop }