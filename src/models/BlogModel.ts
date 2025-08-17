import BaseModel from "@/models/BaseModel";

class BlogModel extends BaseModel {
  constructor() {
    super("blogs");
  }
  static columns = [
    'id', 
    'photo_url',
    'service_type',
    'highlight',
    'status',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default BlogModel;
