import { BadRequestException, Injectable } from '@nestjs/common';
import { NedbHelper } from 'src/util/nedb-helper';
import { CrudTemplate } from './entities/crud-template.entity';

@Injectable()
export class TemplateService {

    private nedbHelper: NedbHelper<CrudTemplate>;

    constructor() {
        this.nedbHelper = new NedbHelper('gen-crud-template');
    }

    findByLanguage(language: string): Promise<CrudTemplate[]> {
        return language ? this.getTemplateByLanguage(language) : this.nedbHelper.findAll();
    }

    async create(template: CrudTemplate): Promise<CrudTemplate> {
        const exs = await this.nedbHelper.findByQuery({ key: template.key });
        if (exs.length > 0) {
            throw new BadRequestException('模板名称已存在');
        }
        return this.nedbHelper.create(template);
    }

    async update(id: string, template: CrudTemplate): Promise<CrudTemplate> {
        const exs = await this.nedbHelper.findByQuery({ key: template.key });
        if (exs.length > 0 && exs[0]._id !== id) {
            throw new BadRequestException('模板名称已存在');
        }
        await this.getTemplateAndCheck(id, true);
        template._id = id;
        return this.nedbHelper.update(id, template);
    }

    async remove(id: string): Promise<boolean> {
        await this.getTemplateAndCheck(id, true);
        return this.nedbHelper.remove(id);
    }

    async unlock(id: string): Promise<boolean> {
        const entity = await this.getTemplateAndCheck(id, false);
        entity.locked = false;
        await this.nedbHelper.update(id, entity);;
        return true;
    }

    getTemplateById(id: string): Promise<CrudTemplate> {
        return this.nedbHelper.findById(id);
    }

    getTemplateByLanguage(language: string): Promise<CrudTemplate[]> {
        return this.nedbHelper.findByQuery({ language });
    }

    async getTemplateAndCheck(id: string, checkLocked: boolean): Promise<CrudTemplate> {
        const template = await this.getTemplateById(id);
        if (!template) {
            throw new BadRequestException('模板不存在');
        }
        if (checkLocked && template.locked) {
            throw new BadRequestException('已锁模板不允许编辑删除');
        }
        return template;
    }

}
