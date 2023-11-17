import { execSync } from "child_process";
import { platform } from "os";
import { decode } from 'iconv-lite';

export interface PlatformProcess {

    killPid(pid: number): boolean;
    findPidByPort(port: number): PidInfo[];
    findPidByName(str: string): PidInfo[];
    findPidInfo(pid: number): PidInfo;
}

interface Net {

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

    findPidInfo(pid: number): PidInfo {
        try {
            const result = this.execSyncConvertResult(`tasklist /NH /FO CSV /FI "PID eq ${pid}"`);
            return this.convertPidInfo(result.split('\r\n')[0]);
        } catch (err) {
            return null;
        }
    }

    killPid(pid: number): boolean {
        try {
            execSync(`taskkill /f /pid ${pid}`, { windowsHide: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    findPidByPort(port: number): PidInfo[] {
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

    findPidByName(str: string): PidInfo[] {
        try {
            const result = this.execSyncConvertResult(`tasklist /NH /FO CSV | findstr ${str}`);
            return result.split('\r\n').filter(line => line.trim().length > 0).map(line => this.convertPidInfo(line));
        } catch (err) {
            return [];
        }
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
    findPidInfo(pid: number): PidInfo {
        throw new Error("Method not implemented.");
    }

    killPid(pid: number): boolean {
        throw new Error("Method not implemented.");
    }
    findPidByPort(port: number): PidInfo[] {
        throw new Error("Method not implemented.");
    }
    findPidByName(str: string): PidInfo[] {
        throw new Error("Method not implemented.");
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