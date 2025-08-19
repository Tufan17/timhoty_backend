import BaseModel from "@/models/BaseModel";

class ApplicationStatusModel extends BaseModel {
  constructor() {
    super("application_status");
  }
  static columns = [
    'id', 
    'name',
    "description",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
   
}

export default ApplicationStatusModel;
