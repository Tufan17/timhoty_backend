import BaseModel from '../BaseModel'

export default class CityModel extends BaseModel {
  constructor() {
    super('cities')
  }
  static columns = ['id', 'name', 'number_plate', 'created_at', 'updated_at', 'deleted_at']
  
}
