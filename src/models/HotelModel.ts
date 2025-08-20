import BaseModel from "@/models/BaseModel";

class HotelModel extends BaseModel {
  constructor() {
    super("hotels");
  }
  static columns = [
    'id',
    'location_id',
    'pool',
    'private_beach',
    'transfer',
    'map_location',
    'free_age_limit',
    'solution_partner_id',
    'star_rating',
    'status',
    'admin_approval',
    'highlight',
    'comment_count',
    'average_rating',
    'refund_days',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default HotelModel;
