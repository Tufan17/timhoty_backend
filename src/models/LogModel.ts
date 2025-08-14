import BaseModel from "@/models/BaseModel";

class LogModel extends BaseModel {
  constructor() {
    super("logs");
  }
  static columns = [
    'id',
    'type',
    'process',
    'target_name',
    'target_id',
    'user_id',
    'content',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default LogModel;
