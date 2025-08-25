import BaseModel from "@/models/BaseModel";

class VisaModel extends BaseModel {
  constructor() {
    super("visas");
  }
  static columns = [
    'id',
    'location_id',
    'refund_days',
    'approval_period',
    'status',
    'highlight',
    'solution_partner_id',
    'admin_approval',
    'comment_count',
    'average_rating',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default VisaModel;
