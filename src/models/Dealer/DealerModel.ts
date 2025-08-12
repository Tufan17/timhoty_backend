import BaseModel from "../BaseModel";

export default class DealerModel extends BaseModel {
  constructor() {
    super("dealers");
  }
  static columns = [
    "id",
    "name",
    "city_id",
    "district_id",
    "address",
    "phone",
    "status",
    "verify",
    "tax_office",
    "tax_number",
    "bank_account_iban",
    "bank_account_name",
    "type",
    "created_at",
    "updated_at",
    "deleted_at",
  ];
}