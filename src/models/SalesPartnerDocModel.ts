import BaseModel from "@/models/BaseModel";

class SalesPartnerDocModel extends BaseModel {
  constructor() {
    super("sales_partner_docs");
  }
  static columns = [
    'id',
    'sales_partner_id',
    'doc_url',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SalesPartnerDocModel;
