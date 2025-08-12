import BaseModel from '../BaseModel'
import connection from '../../db/connection'

export default class DealerCommissionModel extends BaseModel {
  constructor() {
    super('dealer_commissions')
  }
  static columns = ['id', 'dealer_id', 'insurance_type_id', 'commission_rate', 'status', 'created_at', 'updated_at', 'deleted_at']
  

  async dealerCommission(dealer_id: number) {
    const dealerCommission = await connection('dealer_commissions').where('dealer_commissions.dealer_id', dealer_id)
    .leftJoin('insurance_types', 'insurance_types.id', 'dealer_commissions.insurance_type_id')
    .select('dealer_commissions.*', 'insurance_types.name as insurance_type_name');

    return dealerCommission.map((item: any) => {
      return {
        id: item.id,
        insurance:{
          id: item.insurance_type_id,
          name:item.insurance_type_name
        },
        commission_rate: item.commission_rate,
        status: item.status,
      }
    })
  }
}
