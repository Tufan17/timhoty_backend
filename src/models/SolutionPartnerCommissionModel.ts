import BaseModel from "@/models/BaseModel";

class SolutionPartnerCommissionModel extends BaseModel {
  constructor() {
    super("solution_partner_commissions");
  }
  static columns = [
    'id',
    'solution_partner_id',
    'service_type',
    'commission_type',
    'commission_value',
    'commission_currency',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SolutionPartnerCommissionModel;
