import BaseModel from '../BaseModel'

export default class CompanyModel extends BaseModel {
  constructor() {
    super('companies')
  }
  static columns = ['id', 'name', 'status', 'suggested', 'logo', 'created_at', 'updated_at', 'deleted_at']
  
}
