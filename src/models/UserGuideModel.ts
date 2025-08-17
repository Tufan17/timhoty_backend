import BaseModel from "@/models/BaseModel";

class UserGuideModel extends BaseModel {
  constructor() {
    super("user_guides");
  }
  static columns = [
    'id', 
    'order',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default UserGuideModel;
