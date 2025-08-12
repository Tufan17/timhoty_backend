import BaseModel from '../BaseModel'

export default class LandingModel extends BaseModel {
  constructor() {
    super('landing')
  }
  static columns = ['id', 'title', 'description', 'platform', 'image', 'created_at', 'updated_at', 'deleted_at']
  
}
