import { join } from "path";
import * as appConfig from "../config.json";
import axios from "axios";
import { spawn } from "child_process";

const appRootPath = join(__dirname, '../../');

const daemonBaseApi = `http://127.0.0.1:${appConfig.daemonPort}`;

export function getAppRootPath() {
    return appRootPath;
}

export function getRelativeAppRootPath(...paths: string[]) {
    return join(appRootPath, ...paths);
}

export function getConfig() {
    return appConfig;
}

export function startDaemonProcess(): Promise<string> {
    return new Promise((res, rej) => {
        axios.get(`${daemonBaseApi}/ping`, { timeout: 1000 }).catch(err => {
            const daemonProcess = spawn(`node`, [getRelativeAppRootPath('daemon.js')], { detached: true, stdio: 'ignore', windowsHide: true });
            daemonProcess.unref();
        }).finally(() => {
            res(daemonBaseApi);
        })
    })
}

export function stopDaemonProcess(): Promise<void> {
    return new Promise((res, rej) => {
        axios.get(`${daemonBaseApi}/exit`).finally(() => res());
    })
}

export function exitProcess(code: any) {
    stopDaemonProcess().then(() => process.exit(0));
}