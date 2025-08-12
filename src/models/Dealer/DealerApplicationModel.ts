import BaseModel from "../BaseModel";

export default class DealerApplicationModel extends BaseModel {
  constructor() {
    super("dealer_application");
  }

  static columns = [
    "id",
    "name_surname", 
    "email",
    "phone",
    "dealer_name",
    "type",
    "identity_number",
    "tax_office", 
    "tax_number",
    "city_id",
    "district_id",
    "address",
    "bank_account_name",
    "bank_account_iban",
    "document_urls",
    "verify",
    "status",
    "rejection_reason",
    "created_at",
    "updated_at", 
    "deleted_at",
  ];
}
