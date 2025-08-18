import BaseModel from "@/models/BaseModel";

class SalesPartnerModel extends BaseModel {
  constructor() {
    super("sales_partners");
  }
  static columns = [
    'id',
    'location_id',
    'name',
    'phone',
    'whatsapp_no',
    'telegram_no',
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

export default SalesPartnerModel;
