import BaseModel from "@/models/BaseModel";

class SalesPartnerCommissionModel extends BaseModel {
  constructor() {
    super("sales_partner_commissions");
  }
  static columns = [
    'id',
    'sales_partner_id',
    'service_type',
    'commission_type',
    'commission_value',
    'commission_currency',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SalesPartnerCommissionModel;
