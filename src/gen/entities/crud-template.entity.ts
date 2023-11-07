import { BaseEntity } from "src/common/entities/base-entity";

export class CrudTemplate extends BaseEntity {
    key: string;
    language: string;
    locked: boolean;
    moduleFileNameFormat: string;
    extraParams: ExtraParam[];
    modules: CrudTemplateModule[];
}

export class CrudTemplateModule {
    name: string;
    template: string;
    fileNameFormat: string;
    skip: boolean;
}

export class ExtraParam {
    name: string;
    type: string;
    enumList: any[];
}