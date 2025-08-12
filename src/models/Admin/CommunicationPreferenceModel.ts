import BaseModel from '../BaseModel'

export default class CommunicationPreferenceModel extends BaseModel {
  constructor() {
    super('communication_preferences')
  }
  static columns = ['id', 'user_id', 'email', 'sms', 'push', 'created_at', 'updated_at', 'deleted_at']
  
}
