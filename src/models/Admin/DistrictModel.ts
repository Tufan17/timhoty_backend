import BaseModel from '../BaseModel'

export default class DistrictModel extends BaseModel {
  constructor() {
    super('districts')
  }
  static columns = ['id', 'name', 'city_id', 'created_at', 'updated_at', 'deleted_at']
  
}
