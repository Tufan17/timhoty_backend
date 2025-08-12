import BaseModel from '../BaseModel'
import connection from "../../db/connection";

export default class OrderModel extends BaseModel {
  constructor() {
    super('offers')
  }
  static columns = ['id', 'operation_id', 'company_id', 'price', 'status', 'start_date', 'end_date', 'created_at', 'updated_at', 'deleted_at']
  

  async getUserOffers() {
    const rawOffers = await connection('offers as o')
      .leftJoin('operations as op', 'o.operation_id', 'op.id')
      .leftJoin('users as u', 'op.user_id', 'u.id')
      .select(
        'o.id as offer_id',
        'o.price',
        'o.end_date',
        'o.status',
  
        // Operation alanları
        'op.id as operation_id',
        'op.status as operation_status',
  
        // User alanları
        'u.id as user_id',
        'u.name as user_name',
        'u.email as user_email',
        'u.phone as user_phone'
      )
      .where('o.end_date', '<=', new Date());
  
    const offers = rawOffers.map(row => ({
      id: row.offer_id,
      price: row.price,
      end_date: row.end_date,
      status: row.status,
      operations: {
        id: row.operation_id,
        status: row.operation_status,
        user: {
          id: row.user_id,
          name: row.user_name,
          email: row.user_email,
          phone: row.user_phone,
        }
      }
    }));
  
    return offers;
  }
  

}
