import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class TourReservationModel extends BaseModel {
	constructor() {
		super("tour_reservations")
	}

	static columns = ["id", "tour_id", "package_id", "created_by", "sales_partner_id", "progress_id", "price", "currency_code", "payment_id", "different_invoice", "status", "period", "created_at", "updated_at", "deleted_at"]

	async getReservationByTourId(tourId: string) {
		return await knex("tour_reservations").where("tour_id", tourId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByPackageId(packageId: string) {
		return await knex("tour_reservations").where("package_id", packageId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByUserId(userId: string) {
		return await knex("tour_reservations").where("created_by", userId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationBySalesPartnerId(salesPartnerId: string) {
		return await knex("tour_reservations").where("sales_partner_id", salesPartnerId).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async getReservationByPaymentId(paymentId: string) {
		return await knex("tour_reservations").where("payment_id", paymentId).whereNull("deleted_at").first()
	}

	async updatePaymentId(id: string, paymentId: string) {
		return await knex("tour_reservations").where("id", id).whereNull("deleted_at").update({
			payment_id: paymentId,
			updated_at: new Date(),
		})
	}

	async updateStatus(id: string, status: boolean) {
		return await knex("tour_reservations").where("id", id).whereNull("deleted_at").update({
			status: status,
			updated_at: new Date(),
		})
	}

	// async getReservationWithDetails(reservationId: string, language: string = "en") {
	// 	return await knex("tour_reservations")
	// 		.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
	// 		.leftJoin("tour_pivots", function () {
	// 			this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", "en")
	// 		})
	// 		.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
	// 		.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
	// 		.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
	// 		.leftJoin("users", "tour_reservations.created_by", "users.id")
	// 		.leftJoin("sales_partners", "tour_reservations.sales_partner_id", "sales_partners.id")
	// 		.select("tour_reservations.*", "tour_pivots.title as tour_title", "tour_package_prices.price as package_price", "currencies.code as currency_code", "currencies.symbol as currency_symbol", "users.first_name", "users.last_name", "users.email as user_email", "sales_partners.company_name")
	// 		.where("tour_reservations.id", reservationId)
	// 		.whereNull("tour_reservations.deleted_at")
	// 		.first()
	// }
	async getReservationWithDetails(reservationId: string, language: string = "en") {
		return await knex("tour_reservations")
			.select(
				"tour_reservations.*",
				"tour_pivots.title as tour_title",
				"tour_package_pivots.name as package_name",
				"tour_locations.location_id as tour_location_id",
				"tour_packages.return_acceptance_period as package_return_acceptance_period",
				"tour_package_prices.date as package_date",
				"tour_package_prices.discount as package_discount",
				"tour_package_prices.main_price as package_main_price", // ✅ Değişti
				"tour_package_prices.child_price as package_child_price", // ✅ Eklendi
				"tour_package_prices.baby_price as package_baby_price", // ✅ Eklendi
				"currencies.code as currency_code",
				"currencies.symbol as currency_symbol",
				"users.name_surname",
				"users.email as user_email",
				"city_pivots.name as tour_city",
				"country_pivots.name as tour_country",
				knex.raw(`(
					SELECT image_url
					FROM tour_galleries
					WHERE tour_galleries.tour_id = tour_reservations.tour_id
					AND tour_galleries.deleted_at IS NULL
					ORDER BY tour_galleries.created_at ASC
					LIMIT 1
				) as tour_image`),
				knex.raw(
					"COALESCE(json_agg(DISTINCT jsonb_build_object('id', tour_reservation_users.id, 'name', tour_reservation_users.name, 'surname', tour_reservation_users.surname, 'email', tour_reservation_users.email, 'phone', tour_reservation_users.phone, 'type', tour_reservation_users.type, 'age', tour_reservation_users.age, 'room', tour_reservation_users.room)) FILTER (WHERE tour_reservation_users.id IS NOT NULL), '[]'::json) as guests"
				)
			)
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("tour_pivots", function () {
				this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
			.leftJoin("tour_package_pivots", function () {
				this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id").andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("tour_locations", "tours.id", "tour_locations.tour_id")
			.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
			.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
			.leftJoin("users", "tour_reservations.created_by", "users.id")
			.leftJoin("sales_partners", "tour_reservations.sales_partner_id", "sales_partners.id")
			.leftJoin("cities", "tour_locations.location_id", "cities.id")
			.leftJoin("city_pivots", function () {
				this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("countries", "cities.country_id", "countries.id")
			.leftJoin("country_pivots", function () {
				this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
			})
			.leftJoin("tour_reservation_users", "tour_reservations.id", "tour_reservation_users.tour_reservation_id")
			.whereNull("tour_reservation_users.deleted_at")
			.where("tour_reservations.id", reservationId)
			.whereNull("tour_reservations.deleted_at")
			.groupBy(
				"tour_reservations.id",
				"tour_pivots.title",
				"tour_package_pivots.name",
				"tour_locations.location_id",
				"tour_packages.return_acceptance_period",
				"tour_package_prices.date",
				"tour_package_prices.discount",
				"tour_package_prices.main_price",
				"tour_package_prices.child_price",
				"tour_package_prices.baby_price",
				"currencies.code",
				"currencies.symbol",
				"users.name_surname",
				"users.email",
				"city_pivots.name",
				"country_pivots.name"
			)
			.first()
	}

	async getReservationsWithDetails(where?: any, limit?: number, offset?: number) {
		let query = knex("tour_reservations")
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("tour_pivots", function () {
				this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", "en")
			})
			.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
			.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
			.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
			.leftJoin("users", "tour_reservations.created_by", "users.id")
			.leftJoin("sales_partners", "tour_reservations.sales_partner_id", "sales_partners.id")
			.select("tour_reservations.*", "tour_pivots.title as tour_title", "tour_package_prices.price as package_price", "currencies.code as currency_code", "currencies.symbol as currency_symbol", "users.first_name", "users.last_name", "users.email as user_email", "sales_partners.company_name")
			.whereNull("tour_reservations.deleted_at")

		if (where) {
			query = query.where(where)
		}

		query = query.orderBy("tour_reservations.created_at", "desc")

		if (limit) {
			query = query.limit(limit)
		}

		if (offset) {
			query = query.offset(offset)
		}

		return await query
	}

	async getReservationStats() {
		const total = await knex("tour_reservations").whereNull("deleted_at").count("id as total").first()

		const active = await knex("tour_reservations").where("status", true).whereNull("deleted_at").count("id as active").first()

		const pending = await knex("tour_reservations").where("status", false).whereNull("deleted_at").count("id as pending").first()

		const withPayment = await knex("tour_reservations").whereNotNull("payment_id").whereNull("deleted_at").count("id as with_payment").first()

		return {
			total: total?.total || 0,
			active: active?.active || 0,
			pending: pending?.pending || 0,
			with_payment: withPayment?.with_payment || 0,
		}
	}

	// Kullanıcıya ait tour rezervasyonlarını, tour adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
	async getUserReservation(userId: string, language: string) {
		try {
			return await knex("tour_reservations")
				.select(
					"tour_reservations.*",
					"tour_pivots.title as tour_title",
					"city_pivots.name as tour_city",
					"country_pivots.name as tour_country",
					"tour_package_prices.date as package_date",
					"tour_package_prices.discount as package_discount",
					"tour_packages.return_acceptance_period as package_return_acceptance_period",
					"tour_packages.constant_price as package_constant_price",
					"tour_package_pivots.name as package_name",
					"tour_package_pivots.description as package_description",
					"tour_package_pivots.refund_policy as package_refund_policy",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
				SELECT image_url
				FROM tour_galleries
				WHERE tour_galleries.tour_id = tour_reservations.tour_id
				AND tour_galleries.deleted_at IS NULL
				ORDER BY tour_galleries.created_at ASC
				LIMIT 1
			) as tour_image`),
					// Turun tüm lokasyonlarını getir
					knex.raw(
						`(
				SELECT COALESCE(json_agg(
					jsonb_build_object(
						'id', tl.id,
						'location_id', tl.location_id,
						'city_name', cp.name,
						'country_name', cnp.name,
						'country_id', cnp.country_id
					)
				), '[]'::json)
				FROM tour_locations tl
				LEFT JOIN cities c ON tl.location_id = c.id
				LEFT JOIN city_pivots cp ON c.id = cp.city_id AND cp.language_code = ?
				LEFT JOIN country_pivots cnp ON c.country_id = cnp.country_id AND cnp.language_code = ?
				WHERE tl.tour_id = tour_reservations.tour_id
				AND tl.deleted_at IS NULL
			) as tour_locations`,
						[language, language]
					),
					knex.raw(
						"COALESCE(json_agg(DISTINCT jsonb_build_object('id', tour_reservation_users.id, 'name', tour_reservation_users.name, 'surname', tour_reservation_users.surname, 'email', tour_reservation_users.email, 'phone', tour_reservation_users.phone, 'type', tour_reservation_users.type,'age', tour_reservation_users.age,'room', tour_reservation_users.room)) FILTER (WHERE tour_reservation_users.id IS NOT NULL), '[]'::json) as guests"
					),

					knex.raw(`(
				SELECT to_jsonb(c)
				FROM comments c
				WHERE c.reservation_id = tour_reservations.id
					AND c.deleted_at IS NULL
				ORDER BY c.created_at DESC
				LIMIT 1
			) AS comment`)
				)
				.where("tour_reservations.created_by", userId)
				.where("tour_reservations.status", true)
				.whereNull("tour_reservations.deleted_at")
				.leftJoin("tour_pivots", function () {
					this.on("tour_reservations.tour_id", "=", "tour_pivots.tour_id")
						.andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
						.andOnNull("tour_pivots.deleted_at")
				})
				.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
				.leftJoin("cities", "tours.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id")
						.andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
						.andOnNull("city_pivots.deleted_at")
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id")
						.andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
						.andOnNull("country_pivots.deleted_at")
				})
				.leftJoin("tour_packages", function () {
					this.on("tour_reservations.package_id", "=", "tour_packages.id").andOnNull("tour_packages.deleted_at")
				})
				.leftJoin("tour_package_pivots", function () {
					this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id")
						.andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
						.andOnNull("tour_package_pivots.deleted_at")
				})
				.leftJoin("tour_reservation_users", "tour_reservations.id", "tour_reservation_users.tour_reservation_id")
				.whereNull("tour_reservation_users.deleted_at")
				.leftJoin("tour_package_prices", function () {
					this.on("tour_reservations.tour_package_price_id", "=", "tour_package_prices.id").andOnNull("tour_package_prices.deleted_at")
				})

				.groupBy("tour_reservations.id", "tour_pivots.title", "city_pivots.name", "country_pivots.name", "tour_package_prices.discount", "tour_packages.return_acceptance_period", "tour_packages.constant_price", "tour_package_pivots.name", "tour_package_pivots.description", "tour_package_pivots.refund_policy", "tour_package_prices.date")
				.orderBy("tour_reservations.created_at", "desc")
		} catch (error) {
			console.error(error)
			return []
		}
	}

	// async getUserReservationById(reservationId: string, language: string) {
	// 	// Kullanıcıya ait rezervasyonu, tour adı, şehir, ülke ve kişi bilgileriyle birlikte getirir
	// 	return await knex("tour_reservations")
	// 		.select(
	// 			"tour_reservations.*",
	// 			"tour_pivots.title as tour_title",
	// 			"city_pivots.name as tour_city",
	// 			"country_pivots.name as tour_country",
	// 			"tour_packages.date as package_date",
	// 			"tour_packages.discount as package_discount",
	// 			"tour_packages.return_acceptance_period as package_return_acceptance_period",
	// 			"tour_packages.constant_price as package_constant_price",
	// 			"tour_package_pivots.name as package_name",
	// 			"tour_package_pivots.description as package_description",
	// 			"tour_package_pivots.refund_policy as package_refund_policy",
	// 			// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
	// 			knex.raw(`(
	//         SELECT image_url
	//         FROM tour_galleries
	//         WHERE tour_galleries.tour_id = tour_reservations.tour_id
	//         AND tour_galleries.deleted_at IS NULL
	//         ORDER BY tour_galleries.created_at ASC
	//         LIMIT 1
	//       ) as tour_image`),
	// 			// Turun tüm lokasyonlarını getir
	// 			knex.raw(
	// 				`(
	//         SELECT COALESCE(json_agg(
	//           jsonb_build_object(
	//             'id', tl.id,
	//             'location_id', tl.location_id,
	//             'city_name', cp.name,
	//             'country_name', cnp.name,
	//             'country_id', cnp.country_id
	//           )
	//         ), '[]'::json)
	//         FROM tour_locations tl
	//         LEFT JOIN cities c ON tl.location_id = c.id
	//         LEFT JOIN city_pivots cp ON c.id = cp.city_id AND cp.language_code = ?
	//         LEFT JOIN country_pivots cnp ON c.country_id = cnp.country_id AND cnp.language_code = ?
	//         WHERE tl.tour_id = tour_reservations.tour_id
	//         AND tl.deleted_at IS NULL
	//       ) as tour_locations`,
	// 				[language, language]
	// 			),
	// 			knex.raw("COALESCE(json_agg(DISTINCT jsonb_build_object('id', tour_reservation_users.id, 'name', tour_reservation_users.name, 'surname', tour_reservation_users.surname, 'email', tour_reservation_users.email, 'phone', tour_reservation_users.phone, 'type', tour_reservation_users.type,'age', tour_reservation_users.age)) FILTER (WHERE tour_reservation_users.id IS NOT NULL), '[]'::json) as guests")
	// 		)
	// 		.where("tour_reservations.id", reservationId)
	// 		.where("tour_reservations.status", true)
	// 		.whereNull("tour_reservations.deleted_at")
	// 		.leftJoin("tour_pivots", function () {
	// 			this.on("tour_reservations.tour_id", "=", "tour_pivots.tour_id")
	// 				.andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
	// 				.andOnNull("tour_pivots.deleted_at")
	// 		})
	// 		.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
	// 		.leftJoin("cities", "tours.location_id", "cities.id")
	// 		.leftJoin("city_pivots", function () {
	// 			this.on("cities.id", "=", "city_pivots.city_id")
	// 				.andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
	// 				.andOnNull("city_pivots.deleted_at")
	// 		})
	// 		.leftJoin("countries", "cities.country_id", "countries.id")
	// 		.leftJoin("country_pivots", function () {
	// 			this.on("countries.id", "=", "country_pivots.country_id")
	// 				.andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
	// 				.andOnNull("country_pivots.deleted_at")
	// 		})
	// 		.leftJoin("tour_packages", function () {
	// 			this.on("tour_reservations.package_id", "=", "tour_packages.id").andOnNull("tour_packages.deleted_at")
	// 		})
	// 		.leftJoin("tour_package_pivots", function () {
	// 			this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id")
	// 				.andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
	// 				.andOnNull("tour_package_pivots.deleted_at")
	// 		})
	// 		.leftJoin("tour_reservation_users", "tour_reservations.id", "tour_reservation_users.tour_reservation_id")
	// 		.whereNull("tour_reservation_users.deleted_at")
	// 		.groupBy("tour_reservations.id", "tour_pivots.title", "city_pivots.name", "country_pivots.name", "tour_packages.date", "tour_packages.discount", "tour_packages.return_acceptance_period", "tour_packages.constant_price", "tour_package_pivots.name", "tour_package_pivots.description", "tour_package_pivots.refund_policy")
	// 		.orderBy("tour_reservations.created_at", "desc")
	// 		.first()
	// }
	async getUserReservationById(reservationId: string, language: string) {
		// ID'ye göre aldığınız için tek kayıt zaten - GROUP BY'a gerek yok
		const result = await knex("tour_reservations")
			.select(
				"tour_reservations.*",
				"tours.day_count",
				"tours.night_count",
				"tours.refund_days",
				"tours.user_count",
				"tours.average_rating",
				"tours.comment_count",
				"tour_pivots.title as tour_title",
				"city_pivots.name as tour_city",
				"country_pivots.name as tour_country",
				"tour_package_prices.date as package_date",
				"tour_package_prices.discount as package_discount",
				"tour_packages.return_acceptance_period as package_return_acceptance_period",
				"tour_packages.constant_price as package_constant_price",
				"tour_package_pivots.name as package_name",
				"tour_package_pivots.description as package_description",
				"tour_package_pivots.refund_policy as package_refund_policy",
				"tour_package_opportunity_pivots.name as package_opportunity_name",
				knex.raw(`(
              SELECT image_url
              FROM tour_galleries
              WHERE tour_galleries.tour_id = tour_reservations.tour_id
              AND tour_galleries.deleted_at IS NULL
              ORDER BY tour_galleries.created_at ASC
              LIMIT 1
            ) as tour_image`),
				knex.raw(
					`(
              SELECT COALESCE(json_agg(
                jsonb_build_object(
                  'id', tl.id,
                  'location_id', tl.location_id,
                  'city_name', cp.name,
                  'country_name', cnp.name,
                  'country_id', cnp.country_id
                )
              ), '[]'::json)
              FROM tour_locations tl
              LEFT JOIN cities c ON tl.location_id = c.id
              LEFT JOIN city_pivots cp ON c.id = cp.city_id AND cp.language_code = ?
              LEFT JOIN country_pivots cnp ON c.country_id = cnp.country_id AND cnp.language_code = ?
              WHERE tl.tour_id = tour_reservations.tour_id
              AND tl.deleted_at IS NULL
            ) as tour_locations`,
					[language, language]
				),
				knex.raw(`(
              SELECT COALESCE(json_agg(
                jsonb_build_object(
                  'id', tru.id,
                  'name', tru.name,
                  'surname', tru.surname,
                  'email', tru.email,
                   'birthday', tru.birthday,
                  'phone', tru.phone,
                  'type', tru.type,
                  'age', tru.age,
                  'room', tru.room
                )
              ), '[]'::json)
              FROM tour_reservation_users tru
              WHERE tru.tour_reservation_id = tour_reservations.id
              AND tru.deleted_at IS NULL
            ) as guests`),
				knex.raw(`(
              SELECT to_jsonb(tri)
              FROM tour_reservation_invoices tri
              WHERE tri.tour_reservation_id = tour_reservations.id
                AND tri.deleted_at IS NULL
              LIMIT 1
            ) AS invoice`)
			)
			.where("tour_reservations.id", reservationId)
			.where("tour_reservations.status", true)
			.whereNull("tour_reservations.deleted_at")
			.leftJoin("tour_pivots", function () {
				this.on("tour_reservations.tour_id", "=", "tour_pivots.tour_id")
					.andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("tour_pivots.deleted_at")
			})
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("cities", "tours.location_id", "cities.id")
			.leftJoin("city_pivots", function () {
				this.on("cities.id", "=", "city_pivots.city_id")
					.andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("city_pivots.deleted_at")
			})
			.leftJoin("countries", "cities.country_id", "countries.id")
			.leftJoin("country_pivots", function () {
				this.on("countries.id", "=", "country_pivots.country_id")
					.andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("country_pivots.deleted_at")
			})
			.leftJoin("tour_packages", function () {
				this.on("tour_reservations.package_id", "=", "tour_packages.id").andOnNull("tour_packages.deleted_at")
			})
			.leftJoin("tour_package_pivots", function () {
				this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id")
					.andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("tour_package_pivots.deleted_at")
			})
			.leftJoin("tour_package_prices", function () {
				this.on("tour_reservations.tour_package_price_id", "=", "tour_package_prices.id").andOnNull("tour_package_prices.deleted_at")
			})
			.leftJoin("tour_package_opportunities", function () {
				this.on("tour_packages.id", "=", "tour_package_opportunities.tour_package_id").andOnNull("tour_package_opportunities.deleted_at")
			})
			.leftJoin("tour_package_opportunity_pivots", function () {
				this.on("tour_package_opportunities.id", "=", "tour_package_opportunity_pivots.tour_package_opportunity_id")
					.andOn("tour_package_opportunity_pivots.language_code", "=", knex.raw("?", [language]))
					.andOnNull("tour_package_opportunity_pivots.deleted_at")
			})
			.first()

		return result
	}
}

export default TourReservationModel
