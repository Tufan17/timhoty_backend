import BaseModel from '../BaseModel'

export default class FrequentlyAskedQuestionModel extends BaseModel {
  constructor() {
    super('frequently_asked_questions')
  }
  static columns = ['id', 'order', 'title', 'content', 'status', 'insurance_type_id', 'created_at', 'updated_at', 'deleted_at']
  
}
