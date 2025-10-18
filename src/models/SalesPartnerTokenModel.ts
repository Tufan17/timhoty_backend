import BaseModel from "@/models/BaseModel";

class SalesPartnerTokenModel extends BaseModel {
  constructor() {
    super("sales_partner_tokens");
  }
  static columns = [
    'id',
    'sales_partner_user_id',
    'token',
    'expires_at',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SalesPartnerTokenModel;
