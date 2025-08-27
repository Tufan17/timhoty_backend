import BaseModel from "@/models/BaseModel";

class GearTypeModel extends BaseModel {
  constructor() {
    super("gear_types");
  }
  static columns = [
    'id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default GearTypeModel;
