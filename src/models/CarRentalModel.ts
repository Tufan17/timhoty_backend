import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"
import comments from "@/routes/User/comments"

class CarRentalModel extends BaseModel {
	constructor() {
		super("car_rentals")
	}
	static columns = ["id", "location_id", "solution_partner_id", "status", "highlight", "admin_approval", "car_type_id", "gear_type_id", "user_count", "door_count", "age_limit", "air_conditioning", "about_to_run_out", "comment_count", "average_rating", "created_at", "updated_at", "deleted_at"]

	async getDashboardCarRentals(language: string, limit: number = 8): Promise<any[]> {
		try {
			// First get highlighted car rentals
			const highlightedCarRentals = await this.getCarRentalsByHighlightStatus(language, true)

			// If we need more car rentals, get non-highlighted ones
			if (highlightedCarRentals.length < limit) {
				const remainingCount = limit - highlightedCarRentals.length
				const additionalCarRentals = await this.getCarRentalsByHighlightStatus(language, false, remainingCount)
				return [...highlightedCarRentals, ...additionalCarRentals]
			}

			return highlightedCarRentals.slice(0, limit)
		} catch (error) {
			console.error("Error fetching dashboard car rentals:", error)
			return []
		}
	}

	private async getCarRentalsByHighlightStatus(language: string, isHighlighted: boolean, limit?: number): Promise<any[]> {
		try {
			const now = new Date()
			const today = now.toISOString().split("T")[0] // YYYY-MM-DD formatında bugünün tarihi

			// Window function kullanarak her car rental için en ucuz paketi seçiyoruz
			const subquery = knex
				.select(
					"car_rentals.id",
					"car_rentals.highlight",
					"car_rentals.average_rating",
					"car_rentals.user_count",
					"car_rentals.door_count",
					"car_rentals.age_limit",
					"car_rentals.air_conditioning",
					"car_rental_pivots.title",
					"car_rental_packages.discount",
					"car_rental_galleries.image_url",
					"car_rental_packages.constant_price",
					"car_rental_package_prices.main_price",
					"car_rental_package_prices.child_price",
					"car_rental_package_prices.currency_id",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",
					"car_rental_package_prices.start_date",
					"car_rental_package_prices.end_date",
					"car_rentals.created_at",
					"gear_type_pivots.name as gear_type_name",
					knex.raw(`
            ROW_NUMBER() OVER (
              PARTITION BY car_rentals.id
              ORDER BY car_rental_package_prices.main_price ASC, car_rental_galleries.id ASC
            ) as rn
          `)
				)
				.from("car_rentals")
				.whereNull("car_rentals.deleted_at")
				.where("car_rentals.highlight", isHighlighted)
				.where("car_rentals.status", true)
				.where("car_rentals.admin_approval", true)
				.innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
				.where("car_rental_pivots.language_code", language)
				.whereNull("car_rental_pivots.deleted_at")
				.innerJoin("car_rental_galleries", "car_rentals.id", "car_rental_galleries.car_rental_id")
				.whereNull("car_rental_galleries.deleted_at")
				.leftJoin("car_rental_packages", "car_rentals.id", "car_rental_packages.car_rental_id")
				.whereNull("car_rental_packages.deleted_at")
				.leftJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.leftJoin("gear_type_pivots", "car_rentals.gear_type_id", "gear_type_pivots.gear_type_id")
				.where("gear_type_pivots.language_code", language)
				.whereNull("gear_type_pivots.deleted_at")
				.whereNull("car_rental_package_prices.deleted_at")
				.where(function () {
					this.where("car_rental_packages.constant_price", true).orWhere(function () {
						this.where("car_rental_packages.constant_price", false).andWhere(function () {
							this.where("car_rental_package_prices.start_date", "<=", today).andWhere(function () {
								this.whereNull("car_rental_package_prices.end_date").orWhere("car_rental_package_prices.end_date", ">=", today)
							})
						})
					})
				})
				.leftJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function (this: any) {
					this.on("currencies.id", "=", "currency_pivots.currency_id").andOn("currency_pivots.language_code", "=", knex.raw("?", [language]))
				})

			const query = knex
				.select(
					"id",
					"highlight",
					"average_rating",
					"user_count",
					"door_count",
					"age_limit",
					"air_conditioning",
					"title",
					"image_url",
					"gear_type_name",

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
				.from(knex.raw(`(${subquery.toString()}) as ranked_car_rentals`))
				.where("rn", 1)
				.orderBy("created_at", "desc")

			const result = limit ? await query.limit(limit) : await query

			// Paket fiyatlarını temizle ve sadece geçerli olanları al
			return result.map(carRental => {
				if (carRental.package_price) {
					return carRental
				}
				return {
					...carRental,
					package_price: null,
				}
			})
		} catch (error) {
			console.error("Error fetching dashboard car rentals:", error)
			return []
		}
	}

	getComments(language: string, limit: number = 3): Promise<any[]> {
		return knex("comments")
			.where("comments.service_type", "car_rental")
			.whereNull("comments.deleted_at")
			.where("comments.language_code", language)
			.leftJoin("users", "comments.user_id", "users.id")
			.leftJoin("car_rental_pivots", function () {
				this.on("comments.service_id", "car_rental_pivots.car_rental_id").andOn("car_rental_pivots.language_code", knex.raw("?", [language]))
			})
			.whereNull("car_rental_pivots.deleted_at")
			.select("comments.comment as comment", "comments.created_at as created_at", "comments.rating as rating", "users.name_surname as user_name", "users.avatar as user_avatar", "car_rental_pivots.title as title")
			.orderBy("comments.created_at", "desc")
			.limit(limit)
	}
}

export default CarRentalModel
