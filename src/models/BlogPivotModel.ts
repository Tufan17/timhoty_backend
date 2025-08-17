import BaseModel from "@/models/BaseModel";

class BlogPivotModel extends BaseModel {
  constructor() {
    super("blog_pivots");
  }
  static columns = [
    'id',
    'blog_id',
    'title',
    'description',
    'language_code',
    'created_at',
    'updated_at',
    'deleted_at',
  ];
   
}

export default BlogPivotModel;
