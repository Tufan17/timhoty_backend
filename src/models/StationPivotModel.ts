import BaseModel from "@/models/BaseModel";

class StationPivotModel extends BaseModel {
  constructor() {
    super("station_pivots");
  }
  static columns = [
    'id',
    'station_id',
    'name',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default StationPivotModel;
