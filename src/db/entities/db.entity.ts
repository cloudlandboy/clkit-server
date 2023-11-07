import { BaseEntity } from "src/common/entities/base-entity";

export class Db extends BaseEntity {
    dialect: "mysql" | "mariadb";
    host: string;
    port: number;
    uniqueName:string;
    username: string;
    password: string;
    database: string;
}
