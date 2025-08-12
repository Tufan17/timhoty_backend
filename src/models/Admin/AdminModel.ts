import BaseModel from '../BaseModel'

export default class AdminModel extends BaseModel {
  constructor() {
    super('admins')
  }
  static columns = ['id', 'name_surname', 'email', 'password', 'created_at', 'updated_at', 'deleted_at']
  
}
