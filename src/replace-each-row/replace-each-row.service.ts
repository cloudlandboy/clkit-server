import { BadRequestException, Injectable } from '@nestjs/common';
import { ReplaceEachRow } from './entities/replace-each-row.entity';
import { NedbHelper } from 'src/util/nedb-helper';

@Injectable()
export class ReplaceEachRowService {


    private nedbHelper: NedbHelper<ReplaceEachRow>;

    constructor() {
        this.nedbHelper = new NedbHelper('replace-each-row-preset');
    }

    async create(dto: ReplaceEachRow): Promise<ReplaceEachRow> {
        const exs = await this.findByLabel(dto.label);
        if (exs) {
            throw new BadRequestException(`${dto.label} 名称已存在`);
        }
        return this.nedbHelper.create(dto);
    }


    findAll(): Promise<ReplaceEachRow[]> {
        return this.nedbHelper.findAll();
    }

    findById(id: string): Promise<ReplaceEachRow> {
        return this.nedbHelper.findById(id);
    }

    async update(id: string, dto: ReplaceEachRow): Promise<ReplaceEachRow> {
        const exs = await this.findByLabel(dto.label);
        if (exs && exs._id !== id) {
            throw new BadRequestException(`${dto.label} 名称已存在`);
        }
        return this.nedbHelper.update(id, dto);
    }

    remove(id: string): Promise<boolean> {
        return this.nedbHelper.remove(id);
    }

    async findByLabel(label: string): Promise<ReplaceEachRow> {
        const res = await this.nedbHelper.findByQuery({ label });
        return res[0];
    }

}
