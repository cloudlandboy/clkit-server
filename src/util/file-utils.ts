import { StreamableFile } from '@nestjs/common';
import * as fs from 'fs';
import { homedir } from "os";
import { join } from 'path';


export function waitForFile(filePath: string, timeout: number): Promise<StreamableFile> {
    const interval = 12;
    return new Promise((res, rej) => {
        let useTime = 0;
        let lock = false;
        const timer = setInterval(() => {
            if (lock) {
                return;
            }
            lock = true;
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    useTime += interval;
                    if (useTime > timeout) {
                        clearInterval(timer);
                        rej();
                    }
                } else {
                    clearInterval(timer);
                    res(new StreamableFile(fs.createReadStream(filePath)));
                }
                lock = false;
            });
        }, interval);
    })
}

export function fileExists(path: string): boolean {
    try {
        fs.accessSync(path, fs.constants.F_OK)
        return true;
    } catch (err) {
        return false;
    }
}

export const fileType = {
    'html': { contentType: 'text/html' },
    'xhtml': { contentType: 'text/html' },
    'pdf': { contentType: 'application/pdf' },
    'docx': { contentType: 'application/msword' },
    'doc': { contentType: 'application/msword' },
    'txt': { contentType: 'text/plain' },
    'jpg': { contentType: 'image/jpeg' },
    'jpeg': { contentType: 'image/jpeg' },
    'png': { contentType: 'image/png' },
    'svg ': { contentType: 'image/svg+xml' },
    'webp': { contentType: 'image/webp' },
    'xls': { contentType: 'application/vnd.ms-excel' },
    'xlsx': { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
}

export function serverHomeFile(...paths: string[]) {
    return join(homedir(), '.clboy-kit', ...paths);
}