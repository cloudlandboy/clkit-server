/**
 * 字典常量
 * @author: clboy
 * @date: 2023-12-06 11:12:26
 * @Copyright (c) 2023 by syl@clboy.cn, All Rights Reserved. 
 */
export class DictItem {
    readonly label: string;
    readonly value: string;
    readonly [key: string]: any;

    constructor(label: string, value: string, customProp: Record<string, any>) {
        this.label = label;
        this.value = value;
        Object.assign(this, customProp);
    }

    ve(value: string): boolean {
        return this.value === value;
    }

    le(label: string): boolean {
        return this.label === label;
    }
}


export class Dict {
    readonly origin: Record<string, DictItem>;
    private readonly itemList: DictItem[];
    constructor(origin: Record<string, DictItem>) {
        this.itemList = Object.values(origin);
        this.origin = origin;
    }

    findByValue(value: string) {
        return this.itemList.find(item => item.ve(value));
    }

    findByLabel(value: string) {
        return this.itemList.find(item => item.le(value));
    }

    values() {
        return this.itemList.map(item => item.value);
    }
}

/**
 * 集成类型
 */
export const INTEGRATION_TYPES = {
    FOLDER: new DictItem('文件夹', 'folder', { needInstall: false }),
    ONLINE_URL: new DictItem('在线网址', 'online_url', { needInstall: false }),
    DOWNLOAD_URL: new DictItem('文件下载地址', 'download_url', { needInstall: true }),
    DISK_PATH: new DictItem('本地磁盘路径', 'disk_path', { needInstall: true })
}
export const INTEGRATION_TYPE_DICT = new Dict(INTEGRATION_TYPES);

/**
 * LibreOffice转换类型
 */
export const LIBREOFFICE_CONVERT_TYPES = {
    DOC: new DictItem('doc', 'doc', { canTo: ['pdf', 'html', 'xhtml'] }),
    PDF: new DictItem('pdf', 'pdf', { canTo: ['pdf', 'png', 'jpg'] }),
}
export const LIBREOFFICE_CONVERT_TYPE_DICT = new Dict(LIBREOFFICE_CONVERT_TYPES);