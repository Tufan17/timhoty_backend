import BaseModel from '../BaseModel'

export default class DealerDocumentModel extends BaseModel {
  constructor() {
    super('dealer_documents')
  }
  static columns = ['id', 'dealer_id', 'name', 'document_url', 'status', 'created_at', 'updated_at','deleted_at']

  
}
