import { BadRequestException, Injectable, NotImplementedException } from '@nestjs/common';
import { Db } from './entities/db.entity';
import { DataSource, TableColumn } from 'typeorm';
import { ColumnInfo, Table, TableInfo } from './vo/table.vo';
import { NedbHelper } from 'src/util/nedb-helper';
import { hasText } from 'src/util/string-utils';
import * as  Lodash from "lodash";

@Injectable()
export class DbService {
  private nedbHelper: NedbHelper<Db>;
  private dmmList: DbMetadataMapper[];

  constructor() {
    this.nedbHelper = new NedbHelper('database');
    this.dmmList = [new MysqlMetadataMapper()];
  }

  async create(dto: Db): Promise<Db> {
    const exs = await this.nedbHelper.findByQuery({ uniqueName: dto.uniqueName });
    if (exs.length > 0) {
      throw new BadRequestException('唯一名称已存在');
    }
    return this.nedbHelper.create(dto);
  }

  findAll(): Promise<Db[]> {
    return this.nedbHelper.findAll();
  }

  findById(id: string): Promise<Db> {
    return this.nedbHelper.findById(id);
  }

  async update(id: string, dto: Db): Promise<Db> {
    const exs = await this.nedbHelper.findByQuery({ uniqueName: dto.uniqueName });
    if (exs.length > 0 && exs[0]._id !== dto._id) {
      throw new BadRequestException('唯一名称已存在');
    }
    return this.nedbHelper.update(id, dto);
  }

  remove(id: string): Promise<boolean> {
    return this.nedbHelper.remove(id);
  }

  async queryTable(id: string, keyword: string): Promise<Table[]> {
    const db = await this.findById(id);
    if (!db) {
      throw new BadRequestException('数据源不存在');
    }
    for (const mapper of this.dmmList) {
      if (mapper.support(db.dialect)) {
        const tbs = await mapper.queryTable(db);
        return tbs;
      }
    }
    throw new NotImplementedException('不支持的数据源类型');
  }

  async queryTableInfo(id: string, tableNames: string[]): Promise<TableInfo[]> {
    const db = await this.findById(id);
    if (!db) {
      throw new BadRequestException('数据源不存在');
    }
    for (const mapper of this.dmmList) {
      if (mapper.support(db.dialect)) {
        const tbi = await mapper.queryTableInfo(db, tableNames);
        return tbi;
      }
    }
    throw new NotImplementedException('不支持的数据源类型');
  }

}

interface DbMetadataMapper {
  support(dialect: string): boolean;
  queryTable(db: Db): Promise<Table[]>;
  queryTableInfo(db: Db, tableNames: string[]): Promise<TableInfo[]>;
}

class MysqlMetadataMapper implements DbMetadataMapper {

  support(dialect: string): boolean {
    return dialect === 'mysql';
  }

  private async initializeDataSource(db: Db): Promise<DataSource> {
    const datastore = new DataSource({
      type: db.dialect,
      host: db.host,
      port: db.port,
      username: db.username,
      password: db.password,
      database: 'information_schema',
      logging: false
    })
    await datastore.initialize();
    return datastore;
  }

  private async findTable(dbName: string, tableNames: string[], datastore: DataSource): Promise<Table[]> {
    let sql = 'SELECT table_name,table_comment FROM TABLES WHERE table_schema=?';
    let args = [dbName];
    if (Array.isArray(tableNames) && tableNames.length > 0) {
      sql += ` AND table_name IN (${tableNames.map(i => '?').join(',')})`;
      args = args.concat(tableNames);
    }
    const result = await datastore.query(sql, args);
    return result.map(item => {
      return { name: item['table_name'], comment: item['table_comment'] }
    });
  }

  async queryTable(db: Db): Promise<Table[]> {
    const datastore = await this.initializeDataSource(db);
    const tbs = await this.findTable(db.database, null, datastore);
    datastore.destroy();
    return tbs;
  }

  async queryTableInfo(db: Db, tableNames: string[]): Promise<TableInfo[]> {
    const datastore = await this.initializeDataSource(db);
    const tables = await this.findTable(db.database, tableNames, datastore);
    const columns = await datastore.query(`SELECT table_name AS tableName, column_name AS columnName,data_type AS dataType,column_comment AS comment,column_key AS columnKey,extra,is_nullable AS isNullable,column_type AS columnType FROM COLUMNS WHERE table_name IN (${tableNames.map(i => '?').join(',')}) AND table_schema = ? order by ordinal_position`,
      tableNames.concat([db.database]))
    datastore.destroy();
    return tables.map(table => {
      const tableInfo = new TableInfo();
      tableInfo.name = table.name;
      tableInfo.comment = table.comment;
      tableInfo.columnInfos = columns.filter(item => item.tableName === table.name).map(item => Object.assign(new ColumnInfo(), item))
      return tableInfo;
    });
  }

}