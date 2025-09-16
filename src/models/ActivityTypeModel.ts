import BaseModel from "@/models/BaseModel";
import connection from "@/db/knex";

type DataObject = Record<string, any>;

class ActivityTypeModel extends BaseModel {
	constructor() {
		super("activity_types")
	}
	static columns = ["id", "status", "created_at", "updated_at", "deleted_at"]


	async getPivots(language: string): Promise<DataObject[] | undefined> {
		const data = await connection
			.table("activities_type_pivots")
			.whereNull("activities_type_pivots.deleted_at")
			.where("activities_type_pivots.language_code", language)
			.innerJoin("activity_types", "activity_types.id", "activities_type_pivots.activity_type_id")
			.select("activity_types.id as id", "activities_type_pivots.name as name");
      return data;
    }

    async getPivot(id: number | string, language: string): Promise<DataObject | undefined> {
      const data = await connection
        .table("activities_type_pivots")
        .whereNull("activities_type_pivots.deleted_at")
        .where("activities_type_pivots.language_code", language)
        .where("activities_type_pivots.activity_type_id", id)
        .innerJoin("activity_types", "activity_types.id", "activities_type_pivots.activity_type_id")
        .select("activity_types.id as id", "activities_type_pivots.name as name")
        .first();
      return data;
	}
}

export default ActivityTypeModel
