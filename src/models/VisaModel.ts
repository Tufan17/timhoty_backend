import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class VisaModel extends BaseModel {
	constructor() {
		super("visas")
	}
	static columns = ["id", "location_id", "refund_days", "approval_period", "status", "highlight", "solution_partner_id", "admin_approval", "comment_count", "average_rating", "created_at", "updated_at", "deleted_at"]

	async getDashboardVisas(language: string, limit: number = 8): Promise<any[]> {
		try {
			// First get highlighted visas
			const highlightedVisas = await this.getVisasByHighlightStatus(language, true)

			// If we need more visas, get non-highlighted ones
			if (highlightedVisas.length < limit) {
				const remainingCount = limit - highlightedVisas.length
				const additionalVisas = await this.getVisasByHighlightStatus(language, false, remainingCount)
				return [...highlightedVisas, ...additionalVisas]
			}

			return highlightedVisas.slice(0, limit)
		} catch (error) {
			console.error("Error fetching dashboard visas:", error)
			return []
		}
	}

	private async getVisasByHighlightStatus(language: string, isHighlighted: boolean, limit?: number): Promise<any[]> {
		try {
			const now = new Date()
			const today = now.toISOString().split("T")[0] // YYYY-MM-DD formatında bugünün tarihi

			// Window function kullanarak her visa için en ucuz paketi seçiyoruz
			const getCoverImageCategory = (lang: string) => {
				const categories: Record<string, string> = {
					tr: "Kapak Resmi",
					en: "Cover Image",
					ar: "صورة الغلاف",
				}
				return categories[lang] || "Kapak Resmi"
			}
			const coverImageCategory = getCoverImageCategory(language)
			console.log(coverImageCategory)
			const subquery = knex
				.select(
					"visas.id",
					"visas.highlight",
					"visas.average_rating",
					"visas.refund_days",
					"visas.approval_period",
					"visa_pivots.title",
					"visa_galleries.image_url",
					"visa_packages.constant_price",
					"visa_package_prices.main_price",
					"visa_packages.discount",
					"visa_package_prices.child_price",
					"visa_package_prices.currency_id",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",
					"visa_package_prices.start_date",
					"visa_package_prices.end_date",
					"visas.created_at",
					knex.raw(`
      ROW_NUMBER() OVER (
        PARTITION BY visas.id
        ORDER BY visa_package_prices.main_price ASC, visa_galleries.id ASC
      ) as rn
    `)
				)
				.from("visas")
				.whereNull("visas.deleted_at")
				.where("visas.highlight", isHighlighted)
				.where("visas.status", true)
				.where("visas.admin_approval", true)
				.innerJoin("visa_pivots", function () {
					this.on("visas.id", "=", "visa_pivots.visa_id").andOn("visa_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.whereNull("visa_pivots.deleted_at")
				.innerJoin("visa_gallery_pivot", function () {
					this.on("visa_gallery_pivot.language_code", "=", knex.raw("?", [language])).andOn("visa_gallery_pivot.category", "=", knex.raw("?", [coverImageCategory]))
				})
				.whereNull("visa_gallery_pivot.deleted_at")

				.innerJoin("visa_galleries", function () {
					this.on("visas.id", "=", "visa_galleries.visa_id").andOn("visa_galleries.id", "=", "visa_gallery_pivot.visa_gallery_id")
				})
				.whereNull("visa_galleries.deleted_at")
				.leftJoin("visa_packages", "visas.id", "visa_packages.visa_id")
				.whereNull("visa_packages.deleted_at")
				.leftJoin("visa_package_prices", "visa_packages.id", "visa_package_prices.visa_package_id")
				.whereNull("visa_package_prices.deleted_at")
				.where(function () {
					this.where("visa_packages.constant_price", true).orWhere(function () {
						this.where("visa_packages.constant_price", false).andWhere(function () {
							this.where("visa_package_prices.start_date", "<=", today).andWhere(function () {
								this.whereNull("visa_package_prices.end_date").orWhere("visa_package_prices.end_date", ">=", today)
							})
						})
					})
				})
				.leftJoin("currencies", "visa_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function (this: any) {
					this.on("currencies.id", "=", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				})

			const query = knex
				.select(
					"id",
					"highlight",
					"average_rating",
					"refund_days",
					"approval_period",
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
                  'is_constant', true,
									'discount', discount
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
                  'end_date', end_date,
									'discount', discount
                )
              ELSE NULL
            END as package_price
          `),
					"created_at"
				)
				.from(knex.raw(`(${subquery.toString()}) as ranked_visas`))
				.where("rn", 1)
				.orderBy("created_at", "desc")

			const result = limit ? await query.limit(limit) : await query
			console.log(result)

			// Paket fiyatlarını temizle ve sadece geçerli olanları al
			return result.map(visa => {
				if (visa.package_price) {
					return visa
				}
				return {
					...visa,
					package_price: null,
				}
			})
		} catch (error) {
			console.error("Error fetching dashboard visas:", error)
			return []
		}
	}
	getComments(language: string, limit: number = 3, id?: string): Promise<any[]> {
		return knex("comments")
			.where("comments.service_type", "visa")
			.whereNull("comments.deleted_at")

			.modify(qb => {
				if (id) {
					qb.where("comments.service_id", id)
				}
			})
			.leftJoin("users", "comments.user_id", "users.id")
			.leftJoin("visa_pivots", function () {
				this.on("comments.service_id", "visa_pivots.visa_id").andOn("visa_pivots.language_code", knex.raw("?", [language]))
			})
			.whereNull("visa_pivots.deleted_at")
			.select("comments.comment as comment", "comments.created_at as created_at", "comments.rating as rating", "users.name_surname as user_name", "users.avatar as user_avatar", "visa_pivots.title as title")
			.orderBy("comments.created_at", "desc")
			.limit(limit)
	}
}

export default VisaModel
