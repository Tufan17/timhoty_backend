import BaseModel from '../BaseModel'

export default class InsuranceTypeModel extends BaseModel {
  constructor() {
    super('insurance_types')
  }
  static columns = ['id', 'name', 'description', 'status', 'created_at', 'updated_at', 'deleted_at']
  
}
