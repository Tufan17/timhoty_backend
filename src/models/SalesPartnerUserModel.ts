import BaseModel from "@/models/BaseModel";

class SalesPartnerUserModel extends BaseModel {
  constructor() {
    super("sales_partner_users");
  }
  static columns = [
    'id',
    'sales_partner_id',
    'type',
    'name_surname',
    'phone',
    'email',
    'password',
    'language_code',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SalesPartnerUserModel;
