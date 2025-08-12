import BaseModel from '../BaseModel'

export default class PolicyModel extends BaseModel {
  constructor() {
    super('policies')
  }
static columns = ['id', 'offer_id', 'company_id', 'user_id', 'insurance_type_id', 'canceled_policy_id', 'dealer_id', 'policy_number', 'commission_price', 'file_url', 'status', 'start_date', 'end_date', 'created_at', 'updated_at', 'deleted_at']
}
