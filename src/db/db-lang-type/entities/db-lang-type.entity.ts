import { BaseEntity } from "src/common/entities/base-entity";

export class DbLangType extends BaseEntity {
    dbType: string;
    langType: string;
    matchs: LanguageTypeMatch[];
}

export type LanguageTypeMatch = {
    match: string;
    type: string;
    package: string;
    needImport: boolean;
    isNumber: boolean;
    isDecimal: boolean;
    requirerd: boolean;
}