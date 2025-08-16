import BaseModel from "@/models/BaseModel";

class SolutionPartnerDocModel extends BaseModel {
  constructor() {
    super("solution_partner_docs");
  }
  static columns = [
    'id',
    'solution_partner_id',
    'doc_url',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default SolutionPartnerDocModel;
