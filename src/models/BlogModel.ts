import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class BlogModel extends BaseModel {
	constructor() {
		super("blogs")
	}

	static columns = ["id", "photo_url", "service_type", "highlight", "status", "created_at", "updated_at", "deleted_at"]

	async getDashboardBlogs(language: string, limit: number = 4, service_type: string = ""): Promise<any[]> {
		try {
			// Get highlighted blogs with priority
			const highlightedBlogs = await this.getBlogsByHighlightStatus(language, true, undefined, service_type)

			// If we need more blogs, get non-highlighted ones
			if (highlightedBlogs.length < limit) {
				const remainingCount = limit - highlightedBlogs.length
				const additionalBlogs = await this.getBlogsByHighlightStatus(language, false, remainingCount, service_type)
				return [...highlightedBlogs, ...additionalBlogs]
			}

			return highlightedBlogs.slice(0, limit)
		} catch (error) {
			console.error("Error fetching dashboard blogs:", error)
			return []
		}
	}

	private async getBlogsByHighlightStatus(language: string, isHighlighted: boolean, limit?: number, service_type: string = ""): Promise<any[]> {
		const query = knex("blogs").whereNull("blogs.deleted_at").where("blogs.highlight", isHighlighted).innerJoin("blog_pivots", "blogs.id", "blog_pivots.blog_id").where("blog_pivots.language_code", language).whereNull("blog_pivots.deleted_at").select("blogs.id", "blogs.created_at", "blog_pivots.title", "blog_pivots.description", "blogs.photo_url ").orderBy("blogs.created_at", "desc")
		if (service_type) {
			query.where("blogs.service_type", service_type)
		}

		return limit ? query.limit(limit) : query
	}

	async getBlogById(language: string, id: string): Promise<any> {
		// Title'a göre ara (URL formatını normalize et)
		const query = knex("blogs").whereNull("blogs.deleted_at").innerJoin("blog_pivots", "blogs.id", "blog_pivots.blog_id").where("blog_pivots.language_code", language).whereRaw("LOWER(REPLACE(blog_pivots.title, ' ', '-')) = ?", [id.toLowerCase()]).whereNull("blog_pivots.deleted_at").select("blogs.id", "blogs.created_at", "blog_pivots.title", "blog_pivots.description", "blogs.photo_url").first()
		return query
	}
}

export default BlogModel
