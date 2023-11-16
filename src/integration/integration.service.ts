import { BadRequestException, Injectable, NotImplementedException, OnModuleInit } from '@nestjs/common';
import { Integration, IntegrationType } from './entities/integration.entity';
import { NedbHelper } from 'src/util/nedb-helper';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { getConfig, getRelativeAppRootPath } from "../util/app-utils";

@Injectable()
export class IntegrationService implements OnModuleInit {

  private installPath = getRelativeAppRootPath(getConfig().integrationInstallDir);
  private nedbHelper: NedbHelper<Integration>;
  private installerMap: Record<string, IntegrationInstaller>

  constructor() {
    this.nedbHelper = new NedbHelper('integration');
    this.installerMap = {};
    this.installerMap[IntegrationType.REPO] = new RepoIntegrationInstaller();
    this.installerMap[IntegrationType.REPO_RELEASE_FILE] = new RepoReleaseFileIntegrationInstaller();
    this.installerMap[IntegrationType.DOWNLOAD_URL] = new DownloadUrlIntegrationInstaller();
    this.installerMap[IntegrationType.DISK_PATH] = new DiskPathIntegrationInstaller();
  }

  async create(dto: Integration): Promise<Integration> {
    const exs = await this.findByName(dto.name);
    if (exs) {
      throw new BadRequestException(`${dto.name} 名称已存在`);
    }
    dto.installed = (dto.type === IntegrationType.ONLINE_URL);
    return this.nedbHelper.create(dto);
  }

  async findAll(): Promise<Integration[]> {
    return this.nedbHelper.findAll();
  }

  async findAllInstalled(): Promise<Integration[]> {
    return this.nedbHelper.findByQuery({ installed: true });
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
    dto.installed = entity.installed;
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
    if (!existsSync(this.getInstalledDir(id))) {
      mkdirSync(this.getInstalledDir(id), { recursive: true });
    }
    await installer.install(entity);
    entity.installed = true;
    await this.update(id, entity);
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

  onModuleInit() {
    let actualInstalledIds: string[];
    if (existsSync(this.installPath)) {
      actualInstalledIds = readdirSync(this.installPath, { encoding: 'utf8', withFileTypes: true }).filter(i => i.isDirectory).map(i => i.name);
    } else {
      actualInstalledIds = [];
      mkdirSync(this.installPath, { recursive: true });
    }
    this.findAllInstalled().then(installedList => {
      const ids = installedList.filter(i => i.type !== IntegrationType.ONLINE_URL && !actualInstalledIds.includes(i._id)).map(i => i._id);
      if (ids.length > 0) {
        this.nedbHelper.updateByModifiers({ _id: { $in: ids } }, { $set: { installed: false } });
      }
    });
  }
}

interface IntegrationInstaller {

  install(integration: Integration): Promise<void>;

}

class RepoIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration): Promise<void> {
    throw new NotImplementedException('Method not implemented.');
  }

}

class RepoReleaseFileIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration): Promise<void> {
    throw new NotImplementedException('Method not implemented.');
  }

}

class DownloadUrlIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration): Promise<void> {
    throw new NotImplementedException('Method not implemented.');
  }

}

class DiskPathIntegrationInstaller implements IntegrationInstaller {

  async install(integration: Integration): Promise<void> {
    throw new NotImplementedException('Method not implemented.');
  }

}