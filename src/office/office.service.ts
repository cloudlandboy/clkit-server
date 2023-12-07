import { BadRequestException, Injectable, InternalServerErrorException, NotAcceptableException, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec, execSync } from 'child_process';
import { Response } from 'express';
import * as fs from 'fs';
import { tmpdir } from 'os';
import { basename, extname, join as pathJoin } from 'path';
import { fileType, waitForFile } from 'src/util/file-utils';
import { PlatformProcess, getInstances } from 'src/util/os-utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OfficeService {


    private tempDir = tmpdir();
    private platformProcess = getInstances();
    private converter: Converter;

    constructor(private configService: ConfigService) {
        let obp = configService.get<string>('LIBREOFFICE_HOME');
        this.converter = new LibreOfficeConverter(obp, this.tempDir, this.platformProcess);
    }

    async convert(dto: any, file: Express.Multer.File, res: Response): Promise<StreamableFile> {
        if (!this.converter.getSupportTypes().includes(dto.toType)) {
            throw new BadRequestException(`Conversion to ${dto.toType} is not supported`);
        }

        try {
            const ct = fileType[dto.toType].contentType;
            res.header('Content-Type', ct);
            return this.converter.convert(dto, file);
        } catch (err) {
            throw new InternalServerErrorException(err, "convert fail");
        }


    }

    listSupportFileType(): string[] {
        return this.converter.getSupportTypes();
    }


}

abstract class Converter {

    abstract getSupportTypes(): string[];

    abstract convert(dto: any, file: Express.Multer.File): Promise<StreamableFile>;
}

class LibreOfficeConverter extends Converter {

    private binName: string = 'soffice.com';

    private supportFileType: any = {
        'html': { filter: 'html', canFrom: ['*'] },
        'xhtml': { filter: 'xhtml', canFrom: ['*'] },
        'pdf': { filter: 'pdf', canFrom: ['*'] },
        'docx': { filter: 'docx', canFrom: ['*'] },
        'doc': { filter: 'doc', canFrom: ['*'] },
        'txt': { filter: 'txt', canFrom: ['*'] },
        'jpg': { filter: 'jpg', canFrom: ['*'] },
        'jpeg': { filter: 'jpeg', canFrom: ['*'] },
        'png': { filter: 'png', canFrom: ['*'] },
        'webp': { filter: 'webp', canFrom: ['*'] },
        'xls': { filter: 'xls', canFrom: ['xlsx'] },
        'xlsx': { filter: 'xlsx', canFrom: ['xls'] },
    };

    constructor(private officeBinPath: string, private tempDir: string, private platformProcess: PlatformProcess) {
        super();
        if (!officeBinPath) {
            return
        }
        this.officeBinPath = pathJoin(officeBinPath, 'program', this.binName);
        fs.access(this.officeBinPath, fs.constants.F_OK, (err) => {
            if (err) {
                this.officeBinPath = null;
                return;
            }
            this.prepareOffice();
        });
    }

    getSupportTypes(): string[] {
        return Object.keys(this.supportFileType);
    }

    async convert(dto: any, file: Express.Multer.File): Promise<StreamableFile> {
        const ext = extname(file.originalname).substring(1);
        const canFromList = this.supportFileType[dto.toType].canFrom;
        if (canFromList[0] !== '*' && !canFromList.includes(ext)) {
            throw new NotAcceptableException(`Conversion from ${ext} to ${dto.toType} is not supported`)
        }
        const uid = uuidv4();
        const tmpDir = pathJoin(this.tempDir, `clboy-kit-${uid}`);
        const tmpFile = pathJoin(tmpDir, file.originalname);
        const targetFile = pathJoin(tmpDir, `${basename(file.originalname, '.' + ext)}.${dto.toType}`);
        fs.mkdirSync(tmpDir);
        try {
            fs.writeFileSync(tmpFile, file.buffer);
            const command = `${this.officeBinPath} --convert-to ${this.supportFileType[dto.toType].filter} ${tmpFile} --outdir ${tmpDir}`;
            execSync(command);
            return await waitForFile(targetFile, 3000);
        } finally {
            this.prepareOffice();
            fs.rmSync(tmpDir, { recursive: true, force: true })
        }
    }

    private prepareOffice() {
        this.platformProcess.findPidByName(this.binName).then(pid => {
            if (pid.length === 0) {
                exec(`${this.officeBinPath} --headless --invisible`, (err) => {
                    if (err) {
                        console.error(`exec ${this.officeBinPath} fail`);
                    }
                });
            }
        });
    }

}
