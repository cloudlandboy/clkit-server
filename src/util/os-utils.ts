import { exec, execSync, spawn } from "child_process";
import { platform } from "os";
import { decode } from 'iconv-lite';
import * as sudo from "sudo-prompt";
import { hasText } from "./string-utils";


export interface PlatformProcess {

    killPid(pid: number): Promise<boolean>;
    findPidByPort(port: number): Promise<PidInfo[]>;
    findPidByName(str: string): Promise<PidInfo[]>;
    findPidInfo(pid: number): Promise<PidInfo>;
    openUrl(url:string):void;

}

export class OsMap<R> {
    win32?: R;
    linux?: R;
    darwin?: R;
}

export class PidInfo {
    pid: number;
    imageName: string;
    memUsage: number;
}

class Win32PlatformProcess implements PlatformProcess {

    async findPidInfo(pid: number): Promise<PidInfo> {
        try {
            const result = this.execSyncConvertResult(`tasklist /NH /FO CSV /FI "PID eq ${pid}"`);
            return this.convertPidInfo(result.split('\r\n')[0]);
        } catch (err) {
            return null;
        }
    }

    async killPid(pid: number): Promise<boolean> {
        try {
            execSync(`taskkill /f /pid ${pid}`, { windowsHide: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    async findPidByPort(port: number): Promise<PidInfo[]> {
        try {
            const result = this.execSyncConvertResult(`netstat -ano | findstr ":${port}"`);
            const pidMap: any = {};
            result.split('\r\n').forEach(line => {
                const parts = line.trim().split(/\s/);
                const isLocal = parts.some(p => p.trim() === 'LISTENING');
                if (!isLocal) {
                    return
                }
                const pidStr = parts.pop().trim()
                if (pidStr.length === 0) {
                    return
                }
                const pid = Number(pidStr);
                if (pid === 0 || Number.isNaN(pid) || pidMap[pid]) {
                    return
                }
                pidMap[pid] = this.findPidInfo(pid);

            });
            return Object.values(pidMap);
        } catch (err) {
            return [];
        }
    }

    async findPidByName(str: string): Promise<PidInfo[]> {
        try {
            const result = this.execSyncConvertResult(`tasklist /NH /FO CSV | findstr ${str}`);
            return result.split('\r\n').filter(line => line.trim().length > 0).map(line => this.convertPidInfo(line));
        } catch (err) {
            return [];
        }
    }

    openUrl(url: string): void {
        exec(`start ${url}`);
    }

    private execSyncConvertResult(command: string): string {
        const result = execSync(command, { encoding: 'buffer', windowsHide: true });
        return decode(result, 'cp936');
    }

    private convertPidInfo(line: string): PidInfo {
        const pi = new PidInfo();
        const parts = line.split('",');
        pi.imageName = parts[0].replaceAll('"', '');
        pi.pid = Number(parts[1].replaceAll('"', ''));
        pi.memUsage = Number(parts[4].replace(/[^0-9]/g, ''));
        return pi;
    }
}

class UnixPlatformProcess implements PlatformProcess {
    async findPidInfo(pid: number): Promise<PidInfo> {
        const result = execSync(`ps -h -o pid,rss,comm -p ${pid}`, { encoding: 'utf8' });
        if (hasText(result)) {
            return this.convertPidInfo(result);
        }
        return null
    }

    killPid(pid: number): Promise<boolean> {
        return this.sudoExec(`kill -9 ${pid}`, res => res(true), rej => rej(false))
    }

    findPidByPort(port: number): Promise<PidInfo[]> {
        return this.sudoExec(`lsof -i:${port}`, (res, out) => {
            const line = out.toString('utf8').trim().split('\n').find(line => line.indexOf('(LISTEN)') > 0);
            if (!hasText(line)) {
                res([]);
                return
            }
            this.findPidInfo(Number(line.match(/\s{4}(\d+)\s+/)[1])).then(pi => {
                res(pi ? [pi] : []);
            })
        })
    }

    async findPidByName(str: string): Promise<PidInfo[]> {
        try {
            const result = execSync(`ps -a -x -h -o pid,rss,comm | grep -i "${str}"`, { encoding: 'utf8' })
            return result.trim().split('\n').map(line => this.convertPidInfo(line));
        } catch (err) {
            return [];
        }
    }

    openUrl(url: string): void {
        exec(`open ${url}`);
    }

    private sudoExec(command: string, resHandler?: (res: Function, stdout: string | Buffer) => void,
        rejHandler?: (rej: Function, error: Error, stderr: string | Buffer) => void): Promise<any> {
        let timeout = true;
        return new Promise((res, rej) => {
            sudo.exec(command, {
                name: 'clkit'
            }, (err, stdout, stderr) => {
                timeout = false;
                if (err) {
                    if (rejHandler) {
                        rejHandler(rej, err, stderr);
                    } else {
                        rej(err.message);
                    }
                    return;
                }

                if (resHandler) {
                    resHandler(res, stdout);
                } else {
                    res(stdout);
                }
            })

            setTimeout(() => {
                if (timeout) {
                    rej('等待输入sudo密码超时');
                }
            }, 30000)
        })
    }

    private convertPidInfo(line: string): PidInfo {
        const parts = line.trim().split(/\s+/);
        const pidInfo = new PidInfo();
        pidInfo.pid = Number(parts.shift());
        pidInfo.memUsage = Number(parts.shift())
        pidInfo.imageName = parts.join('');
        return pidInfo;
    }

}

export function autoSelect(pmMap: OsMap<any>) {
    let pm = platform();
    return pmMap[pm];
}

const impl: OsMap<PlatformProcess> = {
    win32: new Win32PlatformProcess(),
    linux: new UnixPlatformProcess(),
    darwin: new UnixPlatformProcess()
}

export function getInstances(): PlatformProcess {
    return autoSelect(impl);
}