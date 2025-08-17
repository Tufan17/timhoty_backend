import BaseModel from "@/models/BaseModel";

class CampaignModel extends BaseModel {
  constructor() {
    super("campaigns");
  }
  static columns = [
    'id',
    'start_date',
    'end_date',
    'photo_url',
    'service_type',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CampaignModel;
