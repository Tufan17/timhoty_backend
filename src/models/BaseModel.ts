import connection from '../db/connection';
import HashPassword from '../utils/hashPassword';

type DataObject = Record<string, any>;

class BaseModel {
  modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async create(data: DataObject): Promise<any> {
    if (data.password) {
      data.password = HashPassword(data.password);
    }
    const [result] = await connection.table(this.modelName).insert(data).returning('*');
    return result;
  }

  async update(id: number | string, data: DataObject): Promise<any> {
    if (data.password) {
      data.password = HashPassword(data.password);
    }
    data.updated_at = new Date();
    const result = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .update(data)
      .returning('*');
    return result;
  }
  async first(where: DataObject): Promise<DataObject | undefined> {
    const data = await connection.table(this.modelName)
      .where(where)
      .whereNull('deleted_at')
      .first();
    return data;
  }
  async exists(where: DataObject,whereNot?: DataObject): Promise<boolean> {
    const exists = await connection.table(this.modelName)
      .where(where)
      .whereNot(whereNot || {})
      .whereNull('deleted_at')
      .first();
    return !!exists;
  }
  async getAll(select?: string[] | string, where?: DataObject, orderBy?: string): Promise<DataObject[]> {
    const data = await connection
      .select(select ? [select].flat() : '*')
      .from(this.modelName)
      .whereNull('deleted_at')
      .where(where || {})
      .orderBy(orderBy || 'id');
    return data;
  }

  async getDatatable(select?: string[] | string, where?: DataObject, orderBy?: string, page?: number, limit?: number): Promise<DataObject[]> {
    const data = await connection
      .select(select ? [select].flat() : '*')
      .from(this.modelName)
      .whereNull('deleted_at')
      .where(where || {})
      .orderBy(orderBy || 'id')
      .limit(limit || 10)
      .offset((page || 1) * (limit || 10));
    return data;
  }

  async findId(id: number | string): Promise<DataObject | undefined> {
    const data = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .first();
    return data;
  }

  async where(column: string, val: any,select?: string[] | string,orderBy?: string): Promise<DataObject[]> {
    const data = await connection
      .select(select ? [select].flat() : '*')
      .from(this.modelName)
      .where(column, val)
      .whereNull('deleted_at')
      .orderBy(orderBy || 'id');
    return data;
  }

  async getByIdAll(id: number | string): Promise<DataObject[]> {
    const data = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at');
    return data;
  }

  async pluck(columnName: string): Promise<any[]> {
    const data = await connection
      .table(this.modelName)
      .whereNull('deleted_at')
      .pluck(columnName);
    return data;
  }

  async delete(id: number | string): Promise<number> {
    const result = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .update({ deleted_at: new Date() });
    return result;
  }

  async increment(id: number | string, columnName: string, value: number): Promise<number> {
    const result = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .increment(columnName, value);
    return result;
  }

  async decrement(id: number | string, columnName: string, value: number): Promise<number> {
    const result = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .decrement(columnName, value);
    return result;
  }

  async count(): Promise<number> {
    const data = await connection
      .table(this.modelName)
      .whereNull('deleted_at')
      .count<{ total: number }>('id as total')
      .first();
    return data?.total ?? 0;
  }

  async oneToOne(id: number | string, relationModel: string, relationColumn: string): Promise<DataObject | undefined> {
    const data = await connection
      .table(this.modelName)
      .where({ id })
      .whereNull('deleted_at')
      .join(
        relationModel,
        `${this.modelName}.${relationColumn}`,
        '=',
        `${relationModel}.id`
      )
      .select(`${this.modelName}.*`, `${relationModel}.*`)
      .first();
    return data;
  }

  async manyToOne(relationModel: string, relationColumn: string): Promise<DataObject | undefined> {
    const data = await connection
      .table(this.modelName)
      .whereNull('deleted_at')
      .join(
        relationModel,
        `${this.modelName}.${relationColumn}`,
        '=',
        `${relationModel}.id`
      )
      .select(`${this.modelName}.*`, `${relationModel}.*`)
      .first();
    return data;
  }

  async oneToMany(id: number | string, relationModel: string, relationColumn: string,select?: string[] | string,where?: DataObject): Promise<DataObject[]> {
    const data = await connection
      .table(this.modelName)
      .where(`${this.modelName}.id`, id)
      .whereNull(`${this.modelName}.deleted_at`)
      .leftJoin(
        relationModel,
        `${this.modelName}.id`,
        '=',
        `${relationModel}.${relationColumn}`
      )
      .where(where || {})
      .select(select ? [select].flat() : [`${this.modelName}.*`, `${relationModel}.*`]);
    return data;
  }

  async manyToMany(
    relationModel: string,
    relationThisColumn: string,
    relationOtherModel: string,
    relationOtherColumn: string,
  ): Promise<DataObject[]> {
    const data = await connection
      .table(this.modelName)
      .whereNull('deleted_at')
      .join(
        relationModel,
        `${this.modelName}.${relationThisColumn}`,
        '=',
        `${relationModel}.id`
      )
      .join(
        relationOtherModel,
        `${relationModel}.${relationOtherColumn}`,
        '=',
        `${relationOtherModel}.id`
      )
      .select(`${this.modelName}.*`, `${relationModel}.*`, `${relationOtherModel}.*`);
    return data;
  }

  async findByIds(ids: number[]): Promise<DataObject[]> {
    const data = await connection
      .table(this.modelName)
      .whereIn('id', ids)
      .whereNull('deleted_at');
    return data;
  }

  async limit(limit: number, select?: string[] | string, where?: DataObject, orderBy?: string): Promise<DataObject[]> {
    const data = await connection
      .select(select ? [select].flat() : '*')
      .from(this.modelName)
      .whereNull('deleted_at')
      .where(where || {})
      .orderBy(orderBy || 'id')
      .limit(limit);
    return data;
  }

}

export default BaseModel;
