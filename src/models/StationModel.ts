import BaseModel from "@/models/BaseModel";

class StationModel extends BaseModel {
  constructor() {
    super("stations");
  }
  static columns = [
    'id',
    'location_id',
    'map_location',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default StationModel;
