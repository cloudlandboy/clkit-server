const http = require('http');
const url = require('url');
const config = require('./src/config.json');
const childProcess = require('child_process');
const app = require('./app');

process.title = 'clkit-daemon';

const routerMap = {
    '/ping': (req, res) => {
        res.end(process.pid + '');
    },
    '/reboot': (req, res) => {
        res.end('1');
        setTimeout(() => {
            childProcess.execSync('git pull', { cwd: __dirname, encoding: 'utf8', windowsHide: true, stdio: 'inherit' });
            childProcess.execSync(`node install.js`, { cwd: __dirname, encoding: 'utf8', windowsHide: true, stdio: 'inherit' });
            app.start();
        }, 1000);
    },
    '/exit': (req, res) => {
        res.end('1');
        process.exit(0);
    }
}

const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url);
    const handler = routerMap[reqUrl.pathname];

    if (handler) {
        try {
            handler(req, res);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('server internal error');
        }
        return
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
});
const hostname = '127.0.0.1';
server.listen(config.daemonPort, hostname);