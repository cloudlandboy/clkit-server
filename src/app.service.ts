import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {

    getCurrentVersion(): string {
        const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
        return packageJson.version;
    }

}