/**
 * $1
 * @author: clboy
 * @date: 2023-12-05 20:58:24
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
import { BaseEntity } from "src/common/entities/base-entity";

export class Integration extends BaseEntity {
    folderId: string;
    folderIdPath: string;
    name: string;
    index: string;
    url: string;
    insertScript: string;
    type: string;
    sortValue: number;
    installed: boolean;
}