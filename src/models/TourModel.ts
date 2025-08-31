import BaseModel from "@/models/BaseModel";

class TourModel extends BaseModel {
  constructor() {
    super("tours");
  }
  static columns = [
    'id',
    'solution_partner_id',
    'status',
    'highlight',
    'admin_approval',
    'night_count',
    'day_count',
    'refund_days',
    'user_count',
    'comment_count',
    'average_rating',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default TourModel;
