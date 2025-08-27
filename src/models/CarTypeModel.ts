import BaseModel from "@/models/BaseModel";
import connection from "@/db/knex";

type DataObject = Record<string, any>;

class CarTypeModel extends BaseModel {
  constructor() {
    super("car_types");
  }
  static columns = ["id", "created_at", "updated_at", "deleted_at"];

  async getPivot(
    id: number | string,
    language: string
  ): Promise<DataObject | undefined> {
    const data = await connection
      .table("car_type_pivots")
      .whereNull("deleted_at")
      .where("car_type_pivots.language_code", language)
      .where("car_type_pivots.car_type_id", id)
      .innerJoin("car_types", "car_types.id", "car_type_pivots.car_type_id")
      .select("car_types.id as id", "car_type_pivots.name as name")
      .first();
    return data;
  }
}

export default CarTypeModel;
