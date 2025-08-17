import BaseModel from "@/models/BaseModel";

class CampaignPivotModel extends BaseModel {
  constructor() {
    super("campaign_pivots");
  }
  static columns = [
    'id',
    'campaign_id',
    'title',
    'description',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default CampaignPivotModel;
