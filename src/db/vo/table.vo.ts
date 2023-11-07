export class Table {
    name: string;
    comment: string;
}


export class TableInfo extends Table {
    columnInfos: ColumnInfo[];
}

export class ColumnInfo {
    columnName: string;
    dataType: string;
    comment: string;
    columnKey: string;
    extra: string;
    isNullable: string;
    columnType: string;
}