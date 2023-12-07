import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { transformSync } from "@babel/core";
import { getRelativeAppRootPath } from "../util/app-utils";

@Injectable()
export class SystemService {

    downloadDictConstJs() {
        const tsFileBody = readFileSync(getRelativeAppRootPath('src', 'common', 'constants', 'dict.constants.ts'), 'utf8');
        return transformSync(tsFileBody, {
            filename: 'dict.constants.ts',
            presets: ['@babel/preset-typescript']
        }).code;
    }

}
