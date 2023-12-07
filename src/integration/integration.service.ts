import { BadRequestException, Injectable, NotImplementedException, OnModuleInit } from '@nestjs/common';
import { Integration } from './entities/integration.entity';
import { NedbHelper } from 'src/util/nedb-helper';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, createWriteStream } from 'fs';
import { basename, join } from 'path';
import { getConfig, getRelativeAppRootPath } from "../util/app-utils";
import { hasText } from "../util/string-utils";
import { AxiosResponse } from 'axios';
import { MB_AXIOS_INSTANCE } from "../util/mock-browser-axios";
import { zip, gzip, tar, tgz } from "compressing";
import { IntegrationTreeNode } from './vo/integration-tree.vo';
import { INTEGRATION_TYPES, INTEGRATION_TYPE_DICT } from 'src/common/constants/dict.constants';

@Injectable()
export class IntegrationService implements OnModuleInit {

  private installPath = getRelativeAppRootPath(getConfig().integrationInstallDir);
  private nedbHelper: NedbHelper<Integration>;
  private installerMap: Record<string, IntegrationInstaller>

  constructor() {
    this.nedbHelper = new NedbHelper('integration');
    this.installerMap = {};
    this.installerMap[INTEGRATION_TYPES.DOWNLOAD_URL.value] = new DownloadUrlIntegrationInstaller();
    this.installerMap[INTEGRATION_TYPES.DISK_PATH.value] = new DiskPathIntegrationInstaller();
  }

  async create(dto: Integration): Promise<Integration> {
    const exs = await this.findByName(dto.name);
    if (exs) {
      throw new BadRequestException(`${dto.name} 名称已存在`);
    }
    await this.entityPretreatment(dto, INTEGRATION_TYPES.FOLDER.ve(dto.type) || INTEGRATION_TYPES.ONLINE_URL.ve(dto.type));
    return this.nedbHelper.create(dto);
  }

  async findAll(): Promise<Integration[]> {
    return this.nedbHelper.findAll();
  }

  async getTree(filterInstalled: boolean): Promise<IntegrationTreeNode[]> {
    let items: Integration[];
    if (filterInstalled) {
      items = await this.findAllInstalled();
    } else {
      items = await this.findAll();
    }
    return IntegrationTreeNode.buildTree(items);
  }

  async findAllInstalled(): Promise<Integration[]> {
    const res = await this.nedbHelper.findByQuery({ installed: true });
    res.sort((a, b) => a.sortValue - b.sortValue);
    return res;
  }

  findById(id: string): Promise<Integration> {
    return this.nedbHelper.findById(id);
  }


  async update(id: string, dto: Integration): Promise<Integration> {
    const exs = await this.findByName(dto.name);
    if (exs && exs._id !== id) {
      throw new BadRequestException(`${dto.name} 名称已存在`);
    }
    const entity = await this.findById(id);
    if (!entity) {
      throw new BadRequestException('集成不存在');
    }
    await this.entityPretreatment(dto, entity.installed || INTEGRATION_TYPES.FOLDER.ve(dto.type) || INTEGRATION_TYPES.ONLINE_URL.ve(dto.type));
    return this.nedbHelper.update(id, dto);
  }

  remove(id: string) {
    this.removeInstalledDir(id);
    return this.nedbHelper.remove(id);
  }

  async install(id: string) {
    const entity = await this.findById(id);
    const installer = this.installerMap[entity.type];
    if (!installer) {
      throw new NotImplementedException("不支持的集成类型");
    }
    this.removeInstalledDir(id);
    const installDir = this.getInstalledDir(id);
    if (!existsSync(installDir)) {
      mkdirSync(installDir, { recursive: true });
    }
    await installer.install(entity, installDir);
    entity.installed = true;
    await this.nedbHelper.update(id, entity);
  }

  async findByName(name: string): Promise<Integration> {
    const res = await this.nedbHelper.findByQuery({ name });
    return res[0];
  }

  private getInstalledDir(id: string): string {
    return join(this.installPath, id);
  }
  private removeInstalledDir(id: string) {
    rmSync(this.getInstalledDir(id), { recursive: true, force: true });
  }

  private async entityPretreatment(entity: Integration, installed: boolean) {
    if (INTEGRATION_TYPES.ONLINE_URL.ve(entity.type)) {
      entity.index = '';
      entity.insertScript = '';
    } else if (INTEGRATION_TYPES.FOLDER.ve(entity.type)) {
      entity.index = '';
      entity.url = '';
      entity.insertScript = '';
    } else if (!hasText(entity.index)) {
      entity.index = 'index.html';
    }

    entity.installed = installed;

    if (isNaN(entity.sortValue)) {
      entity.sortValue = 0;
    }

    let folderIdPath = entity.folderId || '0';
    if (folderIdPath !== '0') {
      const folder = await this.findById(entity.folderId);
      if (!folder || !INTEGRATION_TYPES.FOLDER.ve(folder.type)) {
        throw new BadRequestException('上级文件夹不存在');
      }
      folderIdPath = folder.folderId + '>' + folder._id;
    }

    if (entity._id && folderIdPath.includes(entity._id)) {
      throw new BadRequestException('上级文件夹选择不正确');
    }
    return folderIdPath;
  }

  onModuleInit() {
    let actualInstalledIds: string[];
    if (existsSync(this.installPath)) {
      actualInstalledIds = readdirSync(this.installPath, { encoding: 'utf8', withFileTypes: true }).filter(i => i.isDirectory).map(i => i.name);
    } else {
      actualInstalledIds = [];
      mkdirSync(this.installPath, { recursive: true });
    }
    this.findAllInstalled().then(installedList => {
      const ids = installedList.filter(i => INTEGRATION_TYPE_DICT.findByValue(i.type).needInstall && !actualInstalledIds.includes(i._id))
        .map(i => i._id);
      if (ids.length > 0) {
        this.nedbHelper.updateByModifiers({ _id: { $in: ids } }, { $set: { installed: false } });
      }
    });
  }
}

interface IntegrationInstaller {

  install(integration: Integration, installDir: string): Promise<void>;

}

class DownloadUrlIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration, installDir: string): Promise<void> {
    let url: URL;
    try {
      url = new URL(integration.url);
    } catch (err) {
      throw new BadRequestException("下载地址无法解析");
    }

    const res = await MB_AXIOS_INSTANCE.get(integration.url, { responseType: 'stream' });
    if (this.htmlResProcess(res, integration, installDir)) {
      return;
    }

    const contentDisposition = res.headers['content-disposition'] || '';
    let fileName = basename(url.pathname);
    const match = contentDisposition.match(/filename=(.*)?/);
    if (match) {
      fileName = decodeURIComponent(match[1]).replaceAll('"', '');
    }

    const savePath = join(installDir, fileName);
    const writeStream = createWriteStream(savePath)
    res.data.pipe(writeStream);

    return new Promise((rs, rj) => {
      writeStream.on('finish', async () => {
        if (fileName.endsWith('.zip')) {
          await zip.uncompress(savePath, installDir);
        } else if (fileName.endsWith('.tar.gz')) {
          await tgz.uncompress(savePath, installDir);
        } else if (fileName.endsWith('.tar')) {
          await tar.uncompress(savePath, installDir);
        } else if (fileName.endsWith('.gz')) {
          await gzip.uncompress(savePath, join(installDir, integration.index));
        }
        rs();
      })
      writeStream.on('error', () => {
        rj('下载文件出错');
      })
    })
  }

  htmlResProcess(res: AxiosResponse, integration: Integration, installDir: string) {
    const contentType = res.headers['content-type'];
    if (hasText(contentType) && contentType.indexOf('text/html') >= 0) {
      const savePath = join(installDir, integration.index);
      res.data.pipe(createWriteStream(savePath));
      return true;
    }
    return false;
  }
}

class DiskPathIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration, installDir: string): Promise<void> {
    cpSync(integration.url, installDir, { recursive: true, force: true })
  }

}