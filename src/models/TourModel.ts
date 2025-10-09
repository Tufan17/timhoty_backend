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

			const query = knex("tours")
				.whereNull("tours.deleted_at")
				.where("tours.highlight", isHighlighted)
				.where("tours.status", true)
				.where("tours.admin_approval", true)
				.innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
				.where("tour_pivots.language_code", language)
				.whereNull("tour_pivots.deleted_at")
				// Galeri için subquery - sadece ilk galeriyi al
				.leftJoin(knex("tour_galleries").select("tour_id", knex.raw("MIN(image_url) as image_url")).whereNull("deleted_at").groupBy("tour_id").as("first_gallery"), "tours.id", "first_gallery.tour_id")
				.leftJoin("tour_packages", "tours.id", "tour_packages.tour_id")
				.whereNull("tour_packages.deleted_at")
				.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
				.whereNull("tour_package_prices.deleted_at")
				.where(function () {
					this.where("tour_packages.constant_price", true).orWhere(function () {
						this.where("tour_packages.constant_price", false).andWhere(function () {
							this.where("tour_package_prices.start_date", "<=", today).andWhere(function () {
								this.whereNull("tour_package_prices.end_date").orWhere("tour_package_prices.end_date", ">=", today)
							})
						})
					})
				})
				.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function (this: any) {
					this.on("currencies.id", "=", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.select(
					"tours.id",
					"tours.average_rating",
					"tours.highlight",
					"tours.night_count",
					"tours.day_count",
					"tour_pivots.title",
					"first_gallery.image_url as photo",
					knex.raw("MIN(to_char(tour_packages.date, 'YYYY-MM-DD')) as package_date"),
					knex.raw(`
            CASE
              WHEN bool_or(tour_packages.constant_price) = true THEN
                json_build_object(
                  'main_price', MIN(tour_package_prices.main_price),
                  'child_price', MIN(tour_package_prices.child_price),
                  'baby_price', MIN(tour_package_prices.baby_price),
                  'discount', MIN(tour_packages.discount),
                  'currency_id', (array_agg(tour_package_prices.currency_id))[1],
                  'currency_name', MIN(currency_pivots.name),
                  'currency_code', MIN(currencies.code),
                  'currency_symbol', MIN(currencies.symbol),
                  'is_constant', true
                )
              WHEN bool_or(tour_packages.constant_price) = false THEN
                json_build_object(
                  'main_price', MIN(tour_package_prices.main_price),
                  'child_price', MIN(tour_package_prices.child_price),
                  'baby_price', MIN(tour_package_prices.baby_price),
                  'discount', MIN(tour_packages.discount),
                  'currency_id', (array_agg(tour_package_prices.currency_id))[1],
                  'currency_name', MIN(currency_pivots.name),
                  'currency_code', MIN(currencies.code),
                  'currency_symbol', MIN(currencies.symbol),
                  'is_constant', false,
                  'start_date', MIN(tour_package_prices.start_date),
                  'end_date', MIN(tour_package_prices.end_date)
                )
              ELSE NULL
            END as package_price
          `)
				)
				.groupBy("tours.id", "tours.average_rating", "tours.highlight", "tours.night_count", "tours.day_count", "tours.created_at", "tour_pivots.title", "first_gallery.image_url")
				.orderBy("tours.created_at", "desc")

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
