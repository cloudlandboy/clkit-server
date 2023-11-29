import { BaseEntity } from "src/common/entities/base-entity";

export class Integration extends BaseEntity {
    name: string;
    index: string;
    url: string;
    insertScript: string;
    type: IntegrationType;
    sortValue: number;
    installed: boolean;
}

export enum IntegrationType {
    ONLINE_URL = "onlineUrl",
    DOWNLOAD_URL = "downloadUrl",
    DISK_PATH = "diskPath",
}