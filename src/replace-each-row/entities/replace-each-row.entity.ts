import { BaseEntity } from "src/common/entities/base-entity";

export class ReplaceEachRow extends BaseEntity {
    label: string;
    pattern: string;
    sortValue: number;
    params: ReplaceEachRowParam[];
}

export type ReplaceEachRowParam = {
    key: string;
    label: string;
    defaultValue: string;
}