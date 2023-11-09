import { BadRequestException, Injectable, StreamableFile } from '@nestjs/common';
import { GenCrudDto } from './dto/gen-crud.dto';
import { NedbHelper } from 'src/util/nedb-helper';
import { CrudTemplate } from './entities/crud-template.entity';
import { DbService } from 'src/db/db.service';
import { ColumnInfo } from 'src/db/vo/table.vo';
import * as  Lodash from "lodash";
import { hasText } from "../util/string-utils";
import { Handlebars } from "../util/template-utils";
import { Response } from 'express';
import * as path from 'path';
import * as JSZip from "jszip";


@Injectable()
export class GenService {

    private nedbHelper: NedbHelper<CrudTemplate>;
    private languageTypeConverter: Record<string, JavaTypeConverter> = {
        java: new JavaTypeConverter()
    };

    constructor(private readonly dbService: DbService) {
        this.nedbHelper = new NedbHelper('gen-crud-template');
    }

    async genCrud(dto: GenCrudDto, res: Response) {
        if (dto.tableNames.length > 100) {
            throw new BadRequestException('单次生成表数量不能超过100');
        }
        const ltc = this.languageTypeConverter[dto.language];
        if (!ltc) {
            throw new BadRequestException('不支持的语言');
        }
        const templte = await this.getTemplateById(dto.templateId);
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
                    langType: ltc.convert(c)
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

    findTemplate(language: string): Promise<CrudTemplate[]> {
        return language ? this.getTemplateByLanguage(language) : this.nedbHelper.findAll();
    }

    async saveTemplate(template: CrudTemplate): Promise<CrudTemplate> {
        const exs = await this.nedbHelper.findByQuery({ key: template.key });
        if (exs.length > 0) {
            throw new BadRequestException('模板名称已存在');
        }
        return this.nedbHelper.create(template);
    }

    async updateTemplate(id: string, template: CrudTemplate): Promise<CrudTemplate> {
        const exs = await this.nedbHelper.findByQuery({ key: template.key });
        if (exs.length > 0 && exs[0]._id !== template._id) {
            throw new BadRequestException('模板名称已存在');
        }
        await this.getTemplateAndCheck(id, true);
        template._id = id;
        return this.nedbHelper.update(id, template);
    }

    async removeTemplate(id: string): Promise<boolean> {
        await this.getTemplateAndCheck(id, true);
        return this.nedbHelper.remove(id);
    }

    async unlockTemplate(id: string): Promise<boolean> {
        const entity = await this.getTemplateAndCheck(id, false);
        entity.locked = false;
        await this.nedbHelper.update(id, entity);;
        return true;
    }

    getTemplateById(id: string): Promise<CrudTemplate> {
        return this.nedbHelper.findById(id);
    }

    getTemplateByLanguage(language: string): Promise<CrudTemplate[]> {
        return this.nedbHelper.findByQuery({ language });
    }

    async getTemplateAndCheck(id: string, checkLocked: boolean): Promise<CrudTemplate> {
        const template = await this.getTemplateById(id);
        if (!template) {
            throw new BadRequestException('模板不存在');
        }
        if (checkLocked && template.locked) {
            throw new BadRequestException('已锁模板不允许编辑删除');
        }
        return template;
    }

}

export class LanguageType {
    type: string;
    package: string;
    needImport: boolean;
    isNumber: boolean;
    isDecimal: boolean;
}

interface LanguageTypeConverter {
    convert(columnInfo: ColumnInfo): LanguageType;
}

class JavaTypeConverter implements LanguageTypeConverter {

    private stringType: LanguageType = {
        "type": "String",
        "package": "java.lang.String",
        "needImport": false,
        "isNumber": false,
        "isDecimal": false
    }

    private javaToMysqlTypeMapping = {
        "int": {
            type: "INT",
            param: "(11)"
        },
        "integer": {
            type: "INT",
            param: "(11)"
        },
        "long": {
            type: "BIGINT",
            param: "(20)"
        },
        "short": {
            type: "SMALLINT",
            param: "(6)"
        },
        "byte": {
            type: "TINYINT",
            param: "(4)"
        },
        "float": {
            type: "FLOAT",
            param: ""
        },
        "double": {
            type: "DOUBLE",
            param: ""
        },
        "bigDecimal": {
            type: "DECIMAL",
            param: "(10, 2)"
        },
        "localDate": {
            type: "DATE",
            param: ""
        },
        "date": {
            type: "DATETIME",
            param: ""
        },
        "localDateTime": {
            type: "DATETIME",
            param: ""
        },
        "localTime": {
            type: "TIME",
            param: ""
        },
        "boolean": {
            type: "TINYINT",
            param: "(1)"
        },
        "string": {
            type: "VARCHAR",
            param: "(255)"
        },
        "character": {
            type: "VARCHAR",
            param: "(255)"
        },
        "char": {
            type: "CHAR",
            param: ""
        },
    }


    private typeJson = {
        "int": {
            "type": "Integer",
            "package": "java.lang.Integer",
            "needImport": false,
            "isNumber": true,
            "isDecimal": false
        },
        "bigint": {
            "type": "Long",
            "package": "java.lang.Long",
            "needImport": false,
            "isNumber": true,
            "isDecimal": false
        },
        "smallint": {
            "type": "Short",
            "package": "java.lang.Short",
            "needImport": false,
            "isNumber": true,
            "isDecimal": false
        },
        "tinyint": {
            "type": "Byte",
            "package": "java.lang.Byte",
            "needImport": false,
            "isNumber": true,
            "isDecimal": false
        },
        "float": {
            "type": "Float",
            "package": "java.lang.Float",
            "needImport": false,
            "isNumber": true,
            "isDecimal": true
        },
        "double": {
            "type": "Double",
            "package": "java.lang.Double",
            "needImport": false,
            "isNumber": true,
            "isDecimal": true
        },
        "decimal": {
            "type": "BigDecimal",
            "package": "java.math.BigDecimal",
            "needImport": true,
            "isNumber": true,
            "isDecimal": true
        },
        "date": {
            "type": "LocalDate",
            "package": "java.time.LocalDate",
            "needImport": true,
            "isNumber": false,
            "isDecimal": false
        },
        "datetime": {
            "type": "LocalDateTime",
            "package": "java.time.LocalDateTime",
            "needImport": true,
            "isNumber": false,
            "isDecimal": false
        },
        "time": {
            "type": "LocalTime",
            "package": "java.time.LocalTime",
            "needImport": true,
            "isNumber": false,
            "isDecimal": false
        },
        "boolean": {
            "type": "Boolean",
            "package": "java.lang.Boolean",
            "needImport": false,
            "isNumber": false,
            "isDecimal": false
        },
        "blob": {
            "type": "byte[]",
            "package": "",
            "needImport": false,
            "isNumber": false,
            "isDecimal": false
        },
        "geometry": {
            "type": "byte[]",
            "package": "",
            "needImport": false,
            "isNumber": false,
            "isDecimal": false
        },
        "uuid": {
            "type": "UUID",
            "package": "java.util.UUID",
            "needImport": true,
            "isNumber": false,
            "isDecimal": false
        },
        "enum": this.stringType,
        "set": this.stringType,
        "char": this.stringType,
        "varchar": this.stringType,
        "text": this.stringType,
        "json": this.stringType
    }

    convert(columnInfo: ColumnInfo): LanguageType {
        return this.typeJson[columnInfo.dataType] || this.stringType;
    }

}