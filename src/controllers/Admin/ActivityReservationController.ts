import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"

export default class ActivityReservationController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				status,
				activity_id,
				package_id,
				start_date,
				end_date,
			} = req.query as {
				page: number
				limit: number
				search: string
				status?: boolean
				activity_id?: string
				package_id?: string
				start_date?: string
				end_date?: string
			}

			const language = (req as any).language

			// Base query - solution partner'a ait aktivitelerin rezervasyonları
			const base = knex("activity_reservations")
				.whereNull("activity_reservations.deleted_at")
				.leftJoin("activities", "activity_reservations.activity_id", "activities.id")

				.where("activity_reservations.status", true)
				.whereNull("activities.deleted_at")
				.leftJoin("activity_pivots", function () {
					this.on("activity_reservations.activity_id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "activities.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				// Package bilgileri için join'ler
				.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
				.leftJoin("activity_package_pivots", function () {
					this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				// Package hour bilgileri için join
				.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
				.modify(qb => {
					// Filtreler
					if (typeof status !== "undefined") qb.where("activity_reservations.status", status)
					if (activity_id) qb.where("activity_reservations.activity_id", activity_id)
					if (package_id) qb.where("activity_reservations.package_id", package_id)
					if (start_date) qb.where("activity_reservations.date", ">=", start_date)
					if (end_date) qb.where("activity_reservations.date", "<=", end_date)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_pivots.title", "ilike", like)
						})
					}
				})

			// Toplam sayım
			const countRow = await base.clone().clearSelect().clearOrder().count<{ total: string }>("activity_reservations.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi
			const data = await base
				.clone()
				.select(
					"activity_reservations.progress_id",
					"activity_reservations.id",
					"activity_reservations.status",
					"activity_reservations.date",
					"activity_reservations.created_at",
					"activity_reservations.price",
					"activity_reservations.currency_code",
					"activity_pivots.title as activity_title",
					"city_pivots.name as activity_city",
					"country_pivots.name as activity_country",
					"activity_package_pivots.name as package_name",
					"activity_package_hours.hour as activity_hour",
					"activity_package_hours.minute as activity_minute"
					// Aktivite fotoğrafı için subquery
					// knex.raw(`(
					// 	SELECT image_url
					// 	FROM activity_galleries
					// 	WHERE activity_galleries.activity_id = activity_reservations.activity_id
					// 	AND activity_galleries.deleted_at IS NULL
					// 	ORDER BY activity_galleries.created_at ASC
					// 	LIMIT 1
					// ) as activity_image`)
				)
				.groupBy("activity_reservations.id", "activity_pivots.title", "city_pivots.name", "country_pivots.name", "activity_package_pivots.name", "activity_package_hours.hour", "activity_package_hours.minute")
				.orderBy("activity_reservations.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const formattedData = data.map((item: any) => {
				let locale = "en-US" // varsayılan
				if (language === "en") {
					locale = "en-US"
				} else if (language === "ar") {
					locale = "ar-SA"
				} else if (language === "tr") {
					locale = "tr-TR"
				}

				const formatPrice = (price: number, currencyCode?: string) => {
					if (!price && price !== 0) return null

					// Sayıyı düzelt (floating point hatasını gider)
					const cleanPrice = Math.round(price * 100) / 100

					// Dil koduna göre formatla
					const formatter = new Intl.NumberFormat(locale, {
						style: "currency",
						currency: currencyCode || "USD",
						minimumFractionDigits: 0,
						maximumFractionDigits: 2,
					})

					return formatter.format(cleanPrice)
				}

				return {
					...item,
					activity_location: `${item.activity_country || ""}, ${item.activity_city || ""}`.trim(),
					date_formatted: item.date ? new Date(item.date).toLocaleDateString(locale) : null,
					created_at_formatted: item.created_at ? new Date(item.created_at).toLocaleDateString(locale) : null,
					activity_hour: item.activity_hour ? `${item.activity_hour}:${item.activity_minute}` : null,
					price_formatted: formatPrice(item.price, item.currency_code),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("RESERVATION.RESERVATIONS_FETCHED_SUCCESS") || "Rezervasyonlar başarıyla getirildi",
				data: formattedData,
				recordsPerPageOptions: [10, 20, 50, 100],
				total,
				totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("RESERVATION.RESERVATIONS_FETCHED_ERROR") || "Rezervasyonlar getirilirken hata oluştu",
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const reservation = await knex("activity_reservations")
				.select(
					"activity_reservations.*",
					"activity_pivots.title as activity_title",
					"city_pivots.name as activity_city",
					"country_pivots.name as activity_country",
					"activity_package_pivots.name as package_name",
					"activity_package_hours.hour as activity_hour",
					"activity_package_hours.minute as activity_minute",
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
					)
				)
				.where("activity_reservations.id", id)
				.whereNull("activity_reservations.deleted_at")
				.leftJoin("activities", "activity_reservations.activity_id", "activities.id")

				.whereNull("activities.deleted_at")
				.leftJoin("activity_pivots", function () {
					this.on("activity_reservations.activity_id", "=", "activity_pivots.activity_id").andOn("activity_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "activities.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				// Package bilgileri için join'ler
				.leftJoin("activity_packages", "activity_reservations.package_id", "activity_packages.id")
				.leftJoin("activity_package_pivots", function () {
					this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				// Package hour bilgileri için join
				.leftJoin("activity_package_hours", "activity_reservations.activity_package_hour_id", "activity_package_hours.id")
				.leftJoin("activity_reservation_users", "activity_reservations.id", "activity_reservation_users.activity_reservation_id")
				.whereNull("activity_reservation_users.deleted_at")
				.groupBy("activity_reservations.id", "activity_pivots.title", "city_pivots.name", "country_pivots.name", "activity_package_pivots.name", "activity_package_hours.hour", "activity_package_hours.minute")
				.first()

			if (!reservation) {
				return res.status(404).send({
					success: false,
					message: req.t("RESERVATION.RESERVATION_NOT_FOUND") || "Rezervasyon bulunamadı",
				})
			}

			let locale = "en-US" // varsayılan
			if (language === "en") {
				locale = "en-US"
			} else if (language === "ar") {
				locale = "ar-SA"
			} else if (language === "tr") {
				locale = "tr-TR"
			}

			const formatPrice = (price: number, currencyCode?: string) => {
				if (!price && price !== 0) return null

				// Sayıyı düzelt (floating point hatasını gider)
				const cleanPrice = Math.round(price * 100) / 100

				// Dil koduna göre formatla
				const formatter = new Intl.NumberFormat(locale, {
					style: "currency",
					currency: currencyCode || "USD",
					minimumFractionDigits: 0,
					maximumFractionDigits: 2,
				})

				return formatter.format(cleanPrice)
			}

			// Veriyi formatla
			const formattedReservation = {
				...reservation,
				activity_location: `${reservation.activity_country || ""}, ${reservation.activity_city || ""}`.trim(),
				date_formatted: reservation.date ? new Date(reservation.date).toLocaleDateString(locale) : null,
				created_at_formatted: reservation.created_at ? new Date(reservation.created_at).toLocaleDateString(locale) : null,
				updated_at_formatted: reservation.updated_at ? new Date(reservation.updated_at).toLocaleDateString(locale) : null,
				activity_hour: reservation.activity_hour ? `${reservation.activity_hour}:${reservation.activity_minute}` : null,
				price_formatted: formatPrice(reservation.price, reservation.currency_code),
				guest_count: reservation.guests?.length || 0,
			}

			return res.status(200).send({
				success: true,
				message: req.t("RESERVATION.RESERVATION_FETCHED_SUCCESS") || "Rezervasyon başarıyla getirildi",
				data: formattedReservation,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("RESERVATION.RESERVATION_FETCHED_ERROR") || "Rezervasyon getirilirken hata oluştu",
			})
		}
	}
}
