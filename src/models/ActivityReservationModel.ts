import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class ActivityReservationModel extends BaseModel {
	constructor() {
		super("activity_reservations")
	}

	static columns = ["id", "activity_id", "package_id", "activity_package_hour_id", "created_by", "sales_partner_id", "progress_id", "price", "currency_code", "payment_id", "different_invoice", "date", "status", "created_at", "updated_at", "deleted_at"]

	async getReservationByActivityId(activityId: string) {
		return await knex("activity_reservations").where("activity_id", activityId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByPackageId(packageId: string) {
		return await knex("activity_reservations").where("package_id", packageId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByHourId(hourId: string) {
		return await knex("activity_reservations").where("activity_package_hour_id", hourId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByUserId(userId: string) {
		return await knex("activity_reservations").where("created_by", userId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationBySalesPartnerId(salesPartnerId: string) {
		return await knex("activity_reservations").where("sales_partner_id", salesPartnerId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByPaymentId(paymentId: string) {
		return await knex("activity_reservations").where("payment_id", paymentId).whereNull("deleted_at").first()
	}

	async updatePaymentId(id: string, paymentId: string) {
		return await knex("activity_reservations").where("id", id).whereNull("deleted_at").update({
			payment_id: paymentId,
			updated_at: new Date(),
		})
	}

	async updateStatus(id: string, status: boolean) {
		return await knex("activity_reservations").where("id", id).whereNull("deleted_at").update({
			status: status,
			updated_at: new Date(),
		})
	}

	async getReservationWithDetails(reservationId: string) {
		return await knex("activity_reservations")
			.leftJoin("activities", "activity_reservations.activity_id", "activities.id")
			.leftJoin("activity_pivots", function () {
				this.on("activities.id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", "en")
			})
			.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
			.leftJoin("activity_package_pivots", function () {
				this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", "en")
			})
			.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
			.leftJoin("users", "activity_reservations.created_by", "users.id")
			.leftJoin("sales_partners", "activity_reservations.sales_partner_id", "sales_partners.id")
			.select("activity_reservations.*", "activity_pivots.title as activity_title", "activity_package_pivots.name as package_name", "activity_package_hours.hour as activity_hour", "users.first_name", "users.last_name", "users.email as user_email", "sales_partners.company_name")
			.where("activity_reservations.id", reservationId)
			.whereNull("activity_reservations.deleted_at")
			.first()
	}

	async getReservationsWithDetails(where?: any, limit?: number, offset?: number) {
		let query = knex("activity_reservations")
			.leftJoin("activities", "activity_reservations.activity_id", "activities.id")
			.leftJoin("activity_pivots", function () {
				this.on("activities.id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", "en")
			})
			.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
			.leftJoin("activity_package_pivots", function () {
				this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", "en")
			})
			.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
			.leftJoin("users", "activity_reservations.created_by", "users.id")
			.leftJoin("sales_partners", "activity_reservations.sales_partner_id", "sales_partners.id")
			.select("activity_reservations.*", "activity_pivots.title as activity_title", "activity_package_pivots.name as package_name", "activity_package_hours.hour as activity_hour", "users.first_name", "users.last_name", "users.email as user_email", "sales_partners.company_name")
			.whereNull("activity_reservations.deleted_at")

		if (where) {
			query = query.where(where)
		}

		query = query.orderBy("activity_reservations.created_at", "desc")

		if (limit) {
			query = query.limit(limit)
		}

		if (offset) {
			query = query.offset(offset)
		}

		return await query
	}

	async getReservationStats() {
		const total = await knex("activity_reservations").whereNull("deleted_at").count("id as total").first()

		const active = await knex("activity_reservations").where("status", true).whereNull("deleted_at").count("id as active").first()

		const pending = await knex("activity_reservations").where("status", false).whereNull("deleted_at").count("id as pending").first()

		const withPayment = await knex("activity_reservations").whereNotNull("payment_id").whereNull("deleted_at").count("id as with_payment").first()

		return {
			total: total?.total || 0,
			active: active?.active || 0,
			pending: pending?.pending || 0,
			with_payment: withPayment?.with_payment || 0,
		}
	}

	// Kullanıcıya ait activity rezervasyonlarını, activity adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
	async getUserReservation(userId: string, language: string) {
		try {
			return await knex("activity_reservations")
				.select(
					"activity_reservations.*",
					"activity_pivots.title as activity_title",
					"city_pivots.name as activity_city",
					"country_pivots.name as activity_country",
					// Fix: activity_packages.name does not exist, use activity_package_pivots.name
					"activity_package_pivots.name as package_name",
					"activity_package_hours.hour as activity_hour",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
        SELECT image_url
        FROM activity_galleries
        WHERE activity_galleries.activity_id = activity_reservations.activity_id
        AND activity_galleries.deleted_at IS NULL
        ORDER BY activity_galleries.created_at ASC
        LIMIT 1
      ) as activity_image`),
					knex.raw(
						"COALESCE(json_agg(DISTINCT jsonb_build_object('id', activity_reservation_users.id, 'name', activity_reservation_users.name, 'surname', activity_reservation_users.surname, 'email', activity_reservation_users.email, 'phone', activity_reservation_users.phone, 'type', activity_reservation_users.type,'age', activity_reservation_users.age)) FILTER (WHERE activity_reservation_users.id IS NOT NULL), '[]'::json) as guests"
					),

					knex.raw(`(
          SELECT to_jsonb(c)
          FROM comments c
          WHERE c.reservation_id = activity_reservations.id
            AND c.deleted_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT 1
        ) AS comment`)
				)
				.where("activity_reservations.created_by", userId)
				.where("activity_reservations.status", true)
				.whereNull("activity_reservations.deleted_at")
				.leftJoin("activity_pivots", function () {
					this.on("activity_reservations.activity_id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("activities", "activity_reservations.activity_id", "activities.id")
				.leftJoin("cities", "activities.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				// Fix: join activity_packages by id, then join activity_package_pivots for name
				.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
				.leftJoin("activity_package_pivots", function () {
					this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
				.leftJoin("activity_reservation_users", "activity_reservations.id", "activity_reservation_users.activity_reservation_id")
				.whereNull("activity_reservation_users.deleted_at")
				.groupBy("activity_reservations.id", "activity_pivots.title", "city_pivots.name", "country_pivots.name", "activity_package_pivots.name", "activity_package_hours.hour")
				.orderBy("activity_reservations.created_at", "desc")
		} catch (error) {
			console.error("Activity Reservation Error:", error)
			return []
		}
	}

	async getUserReservationById(reservationId: string, language: string) {
		// Kullanıcıya ait rezervasyonu, activity adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
		return await knex("activity_reservations")
			.select(
				"activity_reservations.*",
				"activity_pivots.title as activity_title",
				"city_pivots.name as activity_city",
				"country_pivots.name as activity_country",
				// Fix: activity_packages.name does not exist, use activity_package_pivots.name
				"activity_package_pivots.name as package_name",
				"activity_package_hours.hour as activity_hour",
				"activity_package_hours.minute as activity_minute",
				"activity_packages.return_acceptance_period as package_return_acceptance_period",
				"activity_package_pivots.description as package_description",
				"activity_package_pivots.refund_policy as package_refund_policy",
				"activity_package_opportunity_pivots.name as package_opportunity_name",
				// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
				knex.raw(`(
          SELECT image_url
          FROM activity_galleries
          WHERE activity_galleries.activity_id = activity_reservations.activity_id
          AND activity_galleries.deleted_at IS NULL
          ORDER BY activity_galleries.created_at ASC
          LIMIT 1
        ) as activity_image`),
				knex.raw(
					"COALESCE(json_agg(DISTINCT jsonb_build_object('id', activity_reservation_users.id, 'name', activity_reservation_users.name, 'surname', activity_reservation_users.surname, 'email', activity_reservation_users.email, 'phone', activity_reservation_users.phone, 'type', activity_reservation_users.type,'age', activity_reservation_users.age)) FILTER (WHERE activity_reservation_users.id IS NOT NULL), '[]'::json) as guests"
				),

				knex.raw(`(
          SELECT to_jsonb(c)
          FROM comments c
          WHERE c.reservation_id = activity_reservations.id
            AND c.deleted_at IS NULL
          ORDER BY c.created_at DESC
          LIMIT 1
        ) AS comment`)
			)
			.where("activity_reservations.id", reservationId)
			.where("activity_reservations.status", true)
			.whereNull("activity_reservations.deleted_at")
			.leftJoin("activity_pivots", function () {
				this.on("activity_reservations.activity_id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("activities", "activity_reservations.activity_id", "activities.id")
			.leftJoin("cities", "activities.location_id", "cities.id")
			.leftJoin("city_pivots", function () {
				this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("countries", "cities.country_id", "countries.id")
			.leftJoin("country_pivots", function () {
				this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
			})
			// Fix: join activity_packages by id, then join activity_package_pivots for name
			.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
			.leftJoin("activity_package_pivots", function () {
				this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
			.leftJoin("activity_reservation_users", "activity_reservations.id", "activity_reservation_users.activity_reservation_id")
			.whereNull("activity_reservation_users.deleted_at")
			.leftJoin("activity_package_opportunities", function () {
				this.on("activity_packages.id", "=", "activity_package_opportunities.activity_package_id").andOnNull("activity_package_opportunities.deleted_at")
			})
			.leftJoin("activity_package_opportunity_pivots", function () {
				this.on("activity_package_opportunities.id", "=", "activity_package_opportunity_pivots.activity_package_opportunity_id")
					.andOn("activity_package_opportunity_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("activity_package_opportunity_pivots.deleted_at")
			})
			.groupBy("activity_reservations.id", "activity_pivots.title", "city_pivots.name", "country_pivots.name", "activity_package_pivots.name", "activity_package_hours.hour", "activity_package_hours.minute", "activity_packages.return_acceptance_period", "activity_package_pivots.description", "activity_package_pivots.refund_policy", "activity_package_opportunity_pivots.name")
			.orderBy("activity_reservations.created_at", "desc")
			.first()
	}
}

export default ActivityReservationModel
