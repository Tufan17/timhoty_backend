import knex from "@/db/knex"
import BaseModel from "@/models/BaseModel"

class ActivityModel extends BaseModel {
	constructor() {
		super("activities")
	}
	static columns = ["id", "location_id", "solution_partner_id", "status", "highlight", "admin_approval", "activity_type_id", "free_purchase", "about_to_run_out", "duration", "map_location", "approval_period", "comment_count", "average_rating", "created_at", "updated_at", "deleted_at"]
	async getDashboardActivities(language: string, limit: number = 4): Promise<any[]> {
		try {
			// First get highlighted visas
			const highlightedActivities = await this.getActivitiesByHighlightStatus(language, true)

			// If we need more visas, get non-highlighted ones
			if (highlightedActivities.length < limit) {
				const remainingCount = limit - highlightedActivities.length
				const additionalActivities = await this.getActivitiesByHighlightStatus(language, false, remainingCount)
				return [...highlightedActivities, ...additionalActivities]
			}

			return highlightedActivities.slice(0, limit)
		} catch (error) {
			console.error("Error fetching dashboard activities:", error)
			return []
		}
	}
	private async getActivitiesByHighlightStatus(language: string, isHighlighted: boolean, limit?: number): Promise<any[]> {
		try {
			const now = new Date()
			const today = now.toISOString().split("T")[0] // YYYY-MM-DD formatında bugünün tarihi

			// Window function kullanarak her activity için en ucuz paketi seçiyoruz
			const subquery = knex
				.select(
					"activities.id",
					"activities.highlight",
					"activities.average_rating",
					"activities.approval_period",
					"activities.duration",
					"activity_pivots.title",
					"activity_galleries.image_url",
					"activity_packages.constant_price",
					"activity_package_prices.main_price",
					"activity_package_prices.child_price",
					"activity_package_prices.currency_id",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",
					"activity_package_prices.start_date",
					"activity_package_prices.end_date",
					"activity_packages.id as package_id",
					"activities.created_at",
					knex.raw(`
						ROW_NUMBER() OVER (
							PARTITION BY activities.id 
							ORDER BY activity_package_prices.main_price ASC, activity_galleries.id ASC
						) as rn
					`)
				)
				.from("activities")
				.whereNull("activities.deleted_at")
				.where("activities.highlight", isHighlighted)
				.where("activities.status", true)
				.where("activities.admin_approval", true)
				.innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
				.where("activity_pivots.language_code", language)
				.whereNull("activity_pivots.deleted_at")
				.innerJoin("activity_galleries", "activities.id", "activity_galleries.activity_id")
				.whereNull("activity_galleries.deleted_at")
				.leftJoin("activity_packages", "activities.id", "activity_packages.activity_id")
				.whereNull("activity_packages.deleted_at")
				.leftJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
				.whereNull("activity_package_prices.deleted_at")
				.where(function () {
					this.where("activity_packages.constant_price", true).orWhere(function () {
						this.where("activity_packages.constant_price", false).andWhere(function () {
							this.where("activity_package_prices.start_date", "<=", today).andWhere(function () {
								this.whereNull("activity_package_prices.end_date").orWhere("activity_package_prices.end_date", ">=", today)
							})
						})
					})
				})
				.leftJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function (this: any) {
					this.on("currencies.id", "=", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				});

			const query = knex
				.select(
					"id",
					"highlight",
					"average_rating",
					"approval_period",
					"duration",
					"title",
					"image_url",
					knex.raw(`
						CASE
							WHEN constant_price = true THEN
								json_build_object(
									'main_price', main_price,
									'child_price', child_price,
									'currency_id', currency_id,
									'currency_name', currency_name,
									'currency_code', currency_code,
									'currency_symbol', currency_symbol,
									'is_constant', true
								)
							WHEN constant_price = false THEN
								json_build_object(
									'main_price', main_price,
									'child_price', child_price,
									'currency_id', currency_id,
									'currency_name', currency_name,
									'currency_code', currency_code,
									'currency_symbol', currency_symbol,
									'is_constant', false,
									'start_date', start_date,
									'end_date', end_date
								)
							ELSE NULL
						END as package_price
					`),
					"package_id",
					"created_at"
				)
				.from(knex.raw(`(${subquery.toString()}) as ranked_activities`))
				.where('rn', 1)
				.orderBy("created_at", "desc")

			const result = limit ? await query.limit(limit) : await query

			// Her aktivite için saatleri ayrı olarak al
			const activitiesWithHours = await Promise.all(
				result.map(async activity => {
					if (activity.package_id) {
						const hours = await knex("activity_package_hours").where("activity_package_id", activity.package_id).whereNull("deleted_at").select("hour", "minute").orderBy("hour", "asc").orderBy("minute", "asc")

						return {
							...activity,
							package_price: activity.package_price || null,
							package_hours: hours.length > 0 ? hours : null,
						}
					}

					return {
						...activity,
						package_price: activity.package_price || null,
						package_hours: null,
					}
				})
			)

			// package_id'yi kaldır (sadece internal kullanım içindi)
			return activitiesWithHours.map(({ package_id, ...activity }) => activity)
		} catch (error) {
			console.error("Error fetching dashboard activities:", error)
			return []
		}
	}

	getComments(language: string, limit: number = 3,id?:string): Promise<any[]> {
		return knex("comments")
		  .where("comments.service_type", "activity")
		  .whereNull("comments.deleted_at")
		  .where("comments.language_code", language)
		  .leftJoin("users", "comments.user_id", "users.id")
		  .modify(qb => {
			if (id) {
			  qb.where("comments.service_id", id);
			}
		  })
		  .leftJoin("activity_pivots", function() {
		    this.on("comments.service_id", "activity_pivots.activity_id")
		      .andOn("activity_pivots.language_code", knex.raw("?", [language]));
		  })
		  .whereNull("activity_pivots.deleted_at")
		  .select("comments.comment as comment", "comments.created_at as created_at", "comments.rating as rating", "users.name_surname as user_name", "users.avatar as user_avatar", "activity_pivots.title as title")
		  .orderBy("comments.created_at", "desc")
		  .limit(limit);
	
	  }
}

export default ActivityModel
