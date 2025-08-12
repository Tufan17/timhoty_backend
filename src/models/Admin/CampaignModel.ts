import BaseModel from '../BaseModel'

export default class CampaignModel extends BaseModel {
  constructor() {
    super('campaigns')
  }
  static columns = ['id', 'title', 'description', 'imageUrl','insurance_type_id','status','created_by', 'updated_by', 'deleted_by', 'start_date', 'end_date', 'created_at', 'updated_at', 'deleted_at']
}
