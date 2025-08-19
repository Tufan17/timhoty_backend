import BaseModel from '@/models/BaseModel'

export default class SolutionPartnerTokenModel extends BaseModel {
  constructor() {
    super('solution_partner_tokens')
  }
  static columns = ['id', 'solution_partner_user_id', 'token', 'expires_at', 'created_at', 'updated_at', 'deleted_at']
}
