import { BaseEntity } from "src/common/entities/base-entity";

export class Integration extends BaseEntity {
    name: string;
    index: string;
    url: string;
    type: IntegrationType;
    installed: boolean;
}

export enum IntegrationType {
    REPO = "repo",
    REPO_RELEASE_FILE = "repoReleaseFile",
    ONLINE_URL = "onlineUrl",
    DOWNLOAD_URL = "downloadUrl",
    DISK_PATH = "diskPath",
}