import BaseModel from "@/models/BaseModel";

class TourProgramModel extends BaseModel {
  constructor() {
    super("tour_programs");
  }
  
  static columns = [
    'id',
    'tour_id',
    'order',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default TourProgramModel;
