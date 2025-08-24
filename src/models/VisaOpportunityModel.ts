import knex from "@/db/knex";
import BaseModel from "@/models/BaseModel";

class VisaOpportunityModel extends BaseModel {
  constructor() {
    super("visa_opportunities");
  }
  static columns = [
    'id',
    'visa_id',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  
}

export default VisaOpportunityModel;
