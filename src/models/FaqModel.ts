import BaseModel from "@/models/BaseModel";

class FaqModel extends BaseModel {
  constructor() {
    super("faqs");
  }
  static columns = [
    'id', 
    'order',
    'service_type',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default FaqModel;
