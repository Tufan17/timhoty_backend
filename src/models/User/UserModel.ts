import BaseModel from '../BaseModel'
import knex from '@/db/knex'

export default class UserModel extends BaseModel {
  constructor() {
    super('users')
  }
  static columns = ['id', 'name_surname', 'tc_no', 'email', 'phone', 'job_id', 'dealer_id', 'device_id', 'email_verification', 'otp_code', 'otp_code_expired_at', 'status', 'created_at', 'updated_at', 'deleted_at']


  async userDetail(id: string) {
    const user = await knex
    .from("users")
    .where("users.id", id)
    .leftJoin("jobs", "users.job_id", "jobs.id")
    .leftJoin("dealers", "users.dealer_id", "dealers.id")
    .select("users.*", "jobs.name as job_name","jobs.id as job_id","dealers.name as dealer_name","dealers.id as dealer_id")
    .first();
    const body = {
      id: user?.id,
      name_surname: user?.name_surname,
      tc_no: user?.tc_no,
      email: user?.email,
      phone: user?.phone,
      job_id: user?.job_id,
      job_name: user?.job_name,
      dealer_id: user?.dealer_id,
      device_id: user?.device_id,
      email_verification: user?.email_verification,
      verify: user?.verify,
      status: user?.status,
      created_at: user?.created_at,
      updated_at: user?.updated_at,
      deleted_at: null,
    dealer: {
      id: user.dealer_id,
      name: user.dealer_name,
    },
    
  }
  return body;
  }
}
