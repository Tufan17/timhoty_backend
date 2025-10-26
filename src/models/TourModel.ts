import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class TourModel extends BaseModel {
	constructor() {
		super("tours")
	}
	static columns = ["id", "solution_partner_id", "status", "highlight", "admin_approval", "night_count", "day_count", "refund_days", "user_count", "comment_count", "average_rating", "created_at", "updated_at", "deleted_at"]

	async getDashboardTours(language: string, limit: number = 8): Promise<any[]> {
		try {
			// First get highlighted hotels
			const highlightedTours = await this.getToursByHighlightStatus(language, true)

			// If we need more hotels, get non-highlighted ones
			if (highlightedTours.length < limit) {
				const remainingCount = limit - highlightedTours.length
				const additionalTours = await this.getToursByHighlightStatus(language, false, remainingCount)
				return [...highlightedTours, ...additionalTours]
			}

			return highlightedTours.slice(0, limit)
		} catch (error) {
			console.error("Error fetching dashboard tours:", error)
			return []
		}
	}

	private async getToursByHighlightStatus(language: string, isHighlighted: boolean, limit?: number): Promise<any[]> {
		try {
			const now = new Date()
			const today = now.toISOString().split("T")[0] // YYYY-MM-DD formatında bugünün tarihi
			// console.log(today)
			// console.log(language)
			// console.log(isHighlighted)
			// console.log(limit)
			// Window function kullanarak her tur için en ucuz paketi seçiyoruz
			const subquery = knex
				.select(
					"tours.id",
					"tours.average_rating",
					"tours.highlight",
					"tours.night_count",
					"tours.day_count",
					"tour_pivots.title",
					"tour_galleries.image_url as photo",
					"tour_packages.constant_price",
					"tour_package_prices.main_price",
					"tour_package_prices.child_price",
					"tour_package_prices.baby_price",
					"tour_package_prices.currency_id",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",
					"tour_package_prices.date",
					"tour_package_prices.discount",
					"tours.created_at",
					knex.raw(`
						ROW_NUMBER() OVER (
							PARTITION BY tours.id
							ORDER BY tour_package_prices.main_price ASC, tour_galleries.id ASC
						) as rn
					`)
				)
				.from("tours")
				.whereNull("tours.deleted_at")
				.where("tours.highlight", isHighlighted)
				.where("tours.status", true)
				.where("tours.admin_approval", true)
				.innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
				.where("tour_pivots.language_code", language)
				.whereNull("tour_pivots.deleted_at")
				.innerJoin("tour_galleries", "tours.id", "tour_galleries.tour_id")
				.whereNull("tour_galleries.deleted_at")
				.leftJoin("tour_packages", "tours.id", "tour_packages.tour_id")
				.whereNull("tour_packages.deleted_at")
				.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
				.whereNull("tour_package_prices.deleted_at")
				.where(function () {
					this.where("tour_packages.constant_price", true).orWhere(function () {
						// Sadece bugün ve gelecekteki tarihleri al
						this.where("tour_packages.constant_price", false).andWhere("tour_package_prices.date", ">=", today)
					})
				})
				.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function (this: any) {
					this.on("currencies.id", "=", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				})

			const query = knex
				.select(
					"id",
					"average_rating",
					"highlight",
					"night_count",
					"day_count",
					"title",
					"photo",
					knex.raw(`
						CASE
							WHEN constant_price = true THEN
								json_build_object(
									'main_price', main_price,
									'child_price', child_price,
									'baby_price', baby_price,
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
									'baby_price', baby_price,
									'currency_id', currency_id,
									'currency_name', currency_name,
									'currency_code', currency_code,
									'currency_symbol', currency_symbol,
									'is_constant', false,
									'date', date,
									'discount', discount
								)
							ELSE NULL
						END as package_price
					`),
					"created_at"
				)
				.from(knex.raw(`(${subquery.toString()}) as ranked_tours`))
				.where("rn", 1)
				.orderBy("created_at", "desc")

			const result = limit ? await query.limit(limit) : await query

			// Paket fiyatlarını temizle ve sadece geçerli olanları al
			return result.map(tour => {
				if (tour.package_price) {
					return tour
				}
				return {
					...tour,
					package_price: null,
				}
			})
		} catch (error) {
			console.error("Error fetching dashboard tours:", error)
			return []
		}
	}

	getComments(language: string, limit: number = 3, id?: string): Promise<any[]> {
		return knex("comments")
			.where("comments.service_type", "tour")
			.whereNull("comments.deleted_at")
			.where("comments.language_code", language)
			.modify(qb => {
				if (id) {
					qb.where("comments.service_id", id)
				}
			})
			.leftJoin("users", "comments.user_id", "users.id")
			.leftJoin("tour_pivots", function () {
				this.on("comments.service_id", "tour_pivots.tour_id").andOn("tour_pivots.language_code", knex.raw("?", [language]))
			})
			.whereNull("tour_pivots.deleted_at")
			.select("comments.comment as comment", "comments.created_at as created_at", "comments.rating as rating", "users.name_surname as user_name", "users.avatar as user_avatar", "tour_pivots.title as title")
			.orderBy("comments.created_at", "desc")
			.limit(limit)
	}
}

export default TourModel
