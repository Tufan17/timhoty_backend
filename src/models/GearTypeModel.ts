import BaseModel from "@/models/BaseModel";
import connection from "@/db/knex";


type DataObject = Record<string, any>;

class GearTypePivotModel extends BaseModel {
  constructor() {
    super("gear_type_pivots");
  }
  static columns = [
    'id',
    'gear_type_id',
    'language_code',
    'name',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getPivot(id: number | string, language: string): Promise<DataObject| undefined> {
    const data = await connection
      .table("gear_type_pivots")
      .whereNull('gear_type_pivots.deleted_at')
      .where('gear_type_pivots.language_code', language)
      .where('gear_type_pivots.gear_type_id', id)
      .innerJoin("gear_types", "gear_types.id", "gear_type_pivots.gear_type_id")
      .whereNull('gear_types.deleted_at')
      .select("gear_types.id as id", "gear_type_pivots.name as name")
      .first();
    return data;
  }

  async getPivots(language: string): Promise<DataObject[] | undefined> {
    const data = await connection
      .table("gear_type_pivots")
      .whereNull('gear_type_pivots.deleted_at')
      .where('gear_type_pivots.language_code', language)
      .innerJoin("gear_types", "gear_types.id", "gear_type_pivots.gear_type_id")
      .whereNull('gear_types.deleted_at')
      .select("gear_types.id as id", "gear_type_pivots.name as name");
    return data;
  }
   
}

export default GearTypePivotModel;
