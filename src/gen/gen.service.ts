import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { GenCrudDto } from './dto/gen-crud.dto';
import { DbService } from 'src/db/db.service';
import { ColumnInfo } from 'src/db/vo/table.vo';
import * as  Lodash from "lodash";
import { hasText } from "../util/string-utils";
import { Handlebars } from "../util/template-utils";
import { Response } from 'express';
import * as path from 'path';
import * as JSZip from "jszip";
import { TemplateService } from './template.service';
import { DbLangTypeService } from 'src/db/db-lang-type/db-lang-type.service';
import { DbLangType, LanguageTypeMatch } from 'src/db/db-lang-type/entities/db-lang-type.entity';


@Injectable()
export class GenService {

    constructor(private readonly dbService: DbService, private readonly dbLangTypeService: DbLangTypeService,
        private readonly templateService: TemplateService) {
    }

    async genCrud(dto: GenCrudDto, res: Response) {
        if (dto.tableNames.length > 100) {
            throw new BadRequestException('单次生成表数量不能超过100');
        }

        const templte = await this.templateService.getTemplateById(dto.templateId);
        if (!templte) {
            throw new BadRequestException('模板不存在');
        }
        if (templte.language !== dto.language) {
            throw new BadRequestException('模板语言非 ' + dto.language);
        }


        const db = await this.dbService.findById(dto.dataSourceId);
        if (!db) {
            throw new BadRequestException('数据源不存在');
        }

        const dbLangType = await this.dbLangTypeService.findByDbTypeAndLangType(db.dialect, dto.language)

        if (!dbLangType) {
            throw new BadRequestException(`未找到 ${db.dialect} -> ${dto.language} 类型映射配置`);
        }

        const tableInfos = await this.dbService.queryTableInfo(dto.dataSourceId, dto.tableNames);
        let fileName = dto.tableNames[0];
        if (dto.tableNames.length > 1) {
            fileName = `${db.database}_${tableInfos.length}_table_files`;
        }
        const files = [];

        tableInfos.forEach(tableInfo => {
            const idColumns = [];
            const columnLangTypePackages = new Set();
            const columns = tableInfo.columnInfos.map(c => {
                const column = {
                    isId: c.columnKey === 'PRI',
                    name: c.columnName,
                    camelCaseName: Lodash.camelCase(c.columnName),
                    comment: c.comment || c.columnName,
                    maxStringLength: c.maxStringLength,
                    maxIntDigit: c.maxIntDigit,
                    maxFractionDigit: c.maxFractionDigit,
                    isNullable: c.isNullable,
                    isUnsignedNumber: c.isUnsignedNumber,
                    langType: this.macthLandType(c, dbLangType.matchs)
                }

                if (column.langType.needImport) {
                    columnLangTypePackages.add(column.langType.package);
                }
                if (column.isId) {
                    idColumns.push(column);
                }
                return column;
            });

            const context = {
                tableInfo: {
                    name: tableInfo.name,
                    comment: tableInfo.comment,
                    columns: columns,
                    isCompositeId: idColumns.length !== 1,
                    idColumn: idColumns.length === 1 ? idColumns[0] : null,
                },
                moduleName: '',
                author: dto.author,
                className: Lodash.upperFirst(Lodash.camelCase(tableInfo.name)),
                extraParams: dto.extraParams,
                columnLangTypePackages: Array.from(columnLangTypePackages)
            }

            for (const mdu of templte.modules) {
                if (mdu.skip) {
                    continue;
                }
                context.moduleName = mdu.name;
                let fileNamePattern: string;
                if (hasText(mdu.fileNameFormat)) {
                    fileNamePattern = mdu.fileNameFormat;
                } else if (hasText(templte.moduleFileNameFormat)) {
                    fileNamePattern = templte.moduleFileNameFormat;
                } else {
                    fileNamePattern = `${Lodash.snakeCase(mdu.name)}/${mdu.name}.${templte.language}`
                }

                const moduleFileName = Handlebars.compile(fileNamePattern)(context);
                const result = Handlebars.compile(mdu.template)(context);
                files.push({ name: path.join(fileName, moduleFileName), content: result });
            }

        })

        if (files.length === 0) {
            throw new BadRequestException('无文件生成');
        }

        res.header('Access-Control-Expose-Headers', 'Content-Disposition');
        if (files.length === 1) {
            res.header('Content-Type', 'text/plain;charset=utf-8');
            res.header('Content-Disposition', 'attachment; filename=' + path.basename(files[0].name));
            res.send(files[0].content);
        } else {
            res.header('Content-Type', 'application/zip');


            res.header('Content-Disposition', 'attachment; filename=' + fileName + '.zip');
            const zip = new JSZip();
            files.forEach(item => zip.file(item.name, item.content));
            zip.generateNodeStream().pipe(res)
        }
    }


    macthLandType(columnInfo: ColumnInfo, matchs: LanguageTypeMatch[]): LanguageTypeMatch {
        for (const langType of matchs) {
            const reg = new RegExp(langType.match);
            if (reg.test(columnInfo.dataType)) {
                return langType;
            }
        }

        throw new BadRequestException(`${columnInfo.dataType} 匹配不到类型`);

    }

}