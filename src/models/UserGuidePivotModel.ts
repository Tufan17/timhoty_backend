import BaseModel from "@/models/BaseModel";

class UserGuidePivotModel extends BaseModel {
  constructor() {
    super("user_guide_pivots");
  }
  static columns = [
    'id',
    'user_guide_id',
    'title',
    'description',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default UserGuidePivotModel;
