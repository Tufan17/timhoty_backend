import BaseModel from '../BaseModel'

export default class JobModel extends BaseModel {
  constructor() {
    super('jobs')
  }
  static columns = ['id', 'name', 'created_at', 'updated_at', 'deleted_at']
  
}
