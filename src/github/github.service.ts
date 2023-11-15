import { Injectable } from '@nestjs/common';
import axios from "axios";

@Injectable()
export class GithubService {

    private apiGateway: string = 'https://api.github.com';

    async getClboyKitServerVersion(): Promise<string> {
        const res = await axios.get(this.repoApi('cloudlandboy', 'clboy-kit-server', 'contents/package.json'))
        const latestPackageJson = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8'));
        return latestPackageJson.version;
    }

    async getClboyKitVersion(): Promise<string> {
        const res = await axios.get(this.repoApi('cloudlandboy', 'clboy-kit', 'contents/package.json'))
        const latestPackageJson = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf8'));
        return latestPackageJson.version;
    }

    repoApi(owner: string, repo: string, path: string) {
        return `${this.apiGateway}/repos/${owner}/${repo}/${path}`;
    }
}
