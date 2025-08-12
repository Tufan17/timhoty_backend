import BaseModel from '../BaseModel'

export default class CanceledReasonModel extends BaseModel {
  constructor() {
    super('canceled_reasons')
  }
  static columns = ['id', 'name', 'created_at', 'updated_at', 'deleted_at']
}
