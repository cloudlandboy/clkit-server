export class ScanLanIpVo {

    public ip: string;
    public ports: number[];

    constructor(ip: string) {
        this.ip = ip;
    }
}