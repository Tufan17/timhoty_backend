import BaseModel from "@/models/BaseModel";

class ContractModel extends BaseModel {
  constructor() {
    super("contracts");
  }
  static columns = [
    'id', 
    'key',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default ContractModel;
