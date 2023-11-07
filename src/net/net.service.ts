import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { networkInterfaces, platform } from 'node:os'
import { ScanLanIpVo } from './vo/scan-lan-Ip.vo';
import { exec, execSync } from 'node:child_process';
import { Socket } from 'node:net'
import { ScanLanIpQuery } from './query/san-lan-ip.query';
import { PlatformProcess, getInstances, autoSelect, PidInfo } from 'src/util/os-utils';


@Injectable()
export class NetService {

    private platformProcess: PlatformProcess = getInstances();
    private pingCommand: string = autoSelect({ win32: 'ping -n 1 -w 1 ', linux: 'ping -c 1 -W 1 ', darwin: 'ping -c 1 -W 1 ' });

    constructor() {
    }

    async scanLanIp(query: ScanLanIpQuery): Promise<ScanLanIpVo[]> {
        if (!this.getLanIp().includes(query.ip)) {
            throw new HttpException('ip invalid', HttpStatus.BAD_REQUEST);
        }

        let tasks: Promise<void>[] = [];
        const vos: ScanLanIpVo[] = [];
        const ipAddr: string[] = query.ip.split('.');

        for (let i = 0; i < 256; i++) {
            ipAddr[3] = i + '';
            const ip = ipAddr.join('.');
            if (ip === query.ip) {
                continue;
            }

            tasks.push(new Promise((res, rej) => {
                exec(`${this.pingCommand} ${ip}`, async (err, stdout, stderr) => {
                    if (!err) {
                        vos.push(new ScanLanIpVo(ip));
                    }
                    res();
                })
            }));
        }

        await Promise.all(tasks);

        tasks = [];

        for (const vo of vos) {
            vo.ports = [];
            for (let port = query.minPort; port <= query.maxPort; port++) {
                tasks.push(this.pingPort(vo.ip, port).then(allow => {
                    if (allow) {
                        vo.ports.push(port);
                    }
                }));
                if (tasks.length > 500) {
                    await Promise.all(tasks);
                    tasks = [];
                }
            }
        }

        await Promise.all(tasks);

        return vos;

    }

    getLanIp(): string[] {
        const ni = networkInterfaces();
        const ips = [];
        for (const key in ni) {
            const interfaceInfo = ni[key];
            for (const info of interfaceInfo) {
                if (info.family === 'IPv4' && !info.internal) {
                    ips.push(info.address);
                }
            }
        }
        return ips;
    }

    findPid(type: string, value: string | number): PidInfo[] {
        if (type === 'port') {
            return this.platformProcess.findPidByPort(Number(value));
        } else if (type === 'pid') {
            const pi = this.platformProcess.findPidInfo(Number(value));
            return pi ? [pi] : [];
        } else {
            return this.platformProcess.findPidByName(value + '');
        }
    }

    killPid(pid: number): boolean {
        return this.platformProcess.killPid(pid);
    }

    killPort(port: number): boolean {
        let pidInfo = this.platformProcess.findPidByPort(port)
        return pidInfo.filter(p => this.platformProcess.killPid(p.pid)).some(r => r);
    }

    private async pingPort(ip: string, port: number): Promise<boolean> {
        return new Promise(async (res, rej) => {
            const client = new Socket();
            client.setTimeout(50);
            client.on('connect', () => {
                client.end();
                res(true);
            });
            client.on('timeout', () => {
                client.destroy();
                res(false);
            });

            client.on('error', (error) => {
                client.destroy();
                res(false);
            });
            client.connect(port, ip);
        });
    }
}
