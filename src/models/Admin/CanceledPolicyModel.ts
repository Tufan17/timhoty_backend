import BaseModel from '../BaseModel'

export default class CanceledPolicyModel extends BaseModel {
  constructor() {
    super('canceled_policies')
  }
  static columns = ['id', 'canceled_code', 'file_url', 'date', 'canceled_reason_id', 'created_at', 'updated_at', 'deleted_at']
}
