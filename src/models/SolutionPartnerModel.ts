import BaseModel from "@/models/BaseModel";

class SolutionPartnerModel extends BaseModel {
  constructor() {
    super("solution_partners");
  }
  static columns = [
    'id',
    'location_id',
    'name',
    'phone',
    'address',
    'tax_office',
    'tax_number',
    'bank_name',
    'swift_number',
    'account_owner',
    'iban',
    'language_code',
    'admin_verified',
    'application_status_id',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

}

export default SolutionPartnerModel;
