import BaseModel from '../BaseModel'

export default class OperationModel extends BaseModel {
  constructor() {
    super('operations')
  }
  static columns = ['id', 'user_id', 'insurance_type_id', 'content', 'status', 'created_at', 'updated_at', 'deleted_at']
  

}
