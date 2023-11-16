import { join } from "path";
import * as appConfig from "../config.json";

const appRootPath = join(__dirname, '../../');

export function getAppRootPath() {
    return appRootPath;
}

export function getRelativeAppRootPath(...paths: string[]) {
    return join(appRootPath, ...paths);
}

export function getConfig() {
    return appConfig;
}