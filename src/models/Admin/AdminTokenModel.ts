import BaseModel from '../BaseModel'

export default class AdminTokenModel extends BaseModel {
  constructor() {
    super('admin_tokens')
  }
  static columns = ['id', 'admin_id', 'token', 'created_at', 'updated_at', 'deleted_at']
}
