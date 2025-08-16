import BaseModel from "@/models/BaseModel";

class SolutionPartnerUserModel extends BaseModel {
  constructor() {
    super("solution_partner_users");
  }
  static columns = [
    'id',
    'solution_partner_id',
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

export default SolutionPartnerUserModel;
