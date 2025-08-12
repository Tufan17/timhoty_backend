import BaseModel from '../BaseModel'

export default class AgreementModel extends BaseModel {
  constructor() {
    super('agreements')
  }

  static columns = ['id', 'dealer_wallet_id', 'dealer_id', 'dealer_agreement', 'admin_id', 'admin_agreement', 'receipt_id', 'created_at', 'updated_at', 'deleted_at']
}
