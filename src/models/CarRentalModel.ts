import BaseModel from "@/models/BaseModel";

class CarRentalModel extends BaseModel {
  constructor() {
    super("car_rentals");
  }
  static columns = [
    'id',
    'location_id',
    'solution_partner_id',
    'status',
    'highlight',
    'admin_approval',
    'car_type_id',
    'gear_type_id',
    'user_count',
    'door_count',
    'age_limit',
    'air_conditioning',
    'about_to_run_out',
    'comment_count',
    'average_rating',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CarRentalModel;
