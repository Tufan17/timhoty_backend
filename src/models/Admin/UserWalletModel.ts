import BaseModel from '../BaseModel'

export default class UserWalletModel extends BaseModel {
  constructor() {
    super('user_wallets')
  }
  static columns = ['id', 'user_id', 'policy_id', 'point', 'created_at', 'updated_at', 'deleted_at']
}
