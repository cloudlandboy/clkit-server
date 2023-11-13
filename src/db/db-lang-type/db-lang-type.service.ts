import { BadRequestException, Injectable } from '@nestjs/common';
import { DbLangType } from './entities/db-lang-type.entity';
import { NedbHelper } from 'src/util/nedb-helper';

@Injectable()
export class DbLangTypeService {

  private nedbHelper: NedbHelper<DbLangType>;

  constructor() {
    this.nedbHelper = new NedbHelper('db-lang-type');
  }

  async create(dto: DbLangType): Promise<DbLangType> {
    const exs = await this.findByDbTypeAndLangType(dto.dbType, dto.langType);
    if (exs) {
      throw new BadRequestException(`${dto.dbType} 与 ${dto.langType} 类型映射已存在`);
    }
    return this.nedbHelper.create(dto);
  }

  findAll(): Promise<DbLangType[]> {
    return this.nedbHelper.findAll();
  }

  findById(id: string): Promise<DbLangType> {
    return this.nedbHelper.findById(id);
  }

  async update(id: string, dto: DbLangType): Promise<DbLangType> {
    const exs = await this.findByDbTypeAndLangType(dto.dbType, dto.langType);
    if (exs && exs._id !== id) {
      throw new BadRequestException(`${dto.dbType} 与 ${dto.langType} 类型映射已存在`);
    }
    return this.nedbHelper.update(id, dto);
  }

  remove(id: string): Promise<boolean> {
    return this.nedbHelper.remove(id);
  }

  async findByDbTypeAndLangType(dbType: string, langType: string): Promise<DbLangType> {
    const res = await this.nedbHelper.findByQuery({ dbType, langType });
    return res[0];
  }
}
