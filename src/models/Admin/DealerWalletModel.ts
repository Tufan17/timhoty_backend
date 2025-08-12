import BaseModel from '../BaseModel'

export default class UserWalletModel extends BaseModel {
  constructor() {
    super('dealer_wallets')
  }
  static columns = ['id', 'dealer_id', 'policy_id', 'dealer_user_id', 'price', 'type', 'created_at', 'updated_at', 'deleted_at']
}
