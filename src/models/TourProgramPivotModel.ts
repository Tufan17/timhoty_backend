import BaseModel from "@/models/BaseModel";

class TourProgramPivotModel extends BaseModel {
  constructor() {
    super("tour_program_pivots");
  }
  
  static columns = [
    'id',
    'tour_program_id',
    'title',
    'content',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
}

export default TourProgramPivotModel;
