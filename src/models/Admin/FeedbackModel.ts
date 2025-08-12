import BaseModel from '../BaseModel'

export default class FeedbackModel extends BaseModel {
  constructor() {
    super('feedbacks')
  }
  static columns = ['id', 'user_id', 'insurance_type_id', 'message', 'status', 'created_at', 'updated_at', 'deleted_at']
  
}
