import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

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

  async getDashboardBlogs(language: string, limit: number = 4): Promise<any[]> {
    try {
      // Get highlighted blogs with priority
      const highlightedBlogs = await this.getBlogsByHighlightStatus(language, true);
      
      // If we need more blogs, get non-highlighted ones
      if (highlightedBlogs.length < limit) {
        const remainingCount = limit - highlightedBlogs.length;
        const additionalBlogs = await this.getBlogsByHighlightStatus(language, false, remainingCount);
        return [...highlightedBlogs, ...additionalBlogs];
      }
      
      return highlightedBlogs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching dashboard blogs:', error);
      return [];
    }
  }

  private async getBlogsByHighlightStatus(
    language: string, 
    isHighlighted: boolean, 
    limit?: number
  ): Promise<any[]> {
    const query = knex("blogs")
      .whereNull("blogs.deleted_at")
      .where("blogs.highlight", isHighlighted)
      .innerJoin("blog_pivots", "blogs.id", "blog_pivots.blog_id")
      .where("blog_pivots.language_code", language)
      .whereNull("blog_pivots.deleted_at")
      .select(
        "blogs.id",
        "blogs.created_at", 
        "blog_pivots.title",
        "blog_pivots.description"
      )
      .orderBy("blogs.created_at", "desc");

    return limit ? query.limit(limit) : query;
  }
}

export default BlogModel;