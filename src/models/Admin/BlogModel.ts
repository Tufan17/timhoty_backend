import BaseModel from '../BaseModel'

export default class BlogModel extends BaseModel {
  constructor() {
    super('blogs')
  }
  static columns = ['id', 'title','description', 'content', 'imageUrl','insurance_type_id','status','created_by', 'updated_by', 'deleted_by', 'created_at', 'updated_at', 'deleted_at']
}
