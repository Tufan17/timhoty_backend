import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"

export default class CarRentalReservationController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				status,
				car_rental_id,
				start_date,
				end_date,
			} = req.query as {
				page: number
				limit: number
				search: string
				status?: boolean
				car_rental_id?: string
				start_date?: string
				end_date?: string
			}

			const language = (req as any).language

			const base = knex("car_rental_reservations")
				.whereNull("car_rental_reservations.deleted_at")
				.where("car_rental_reservations.status", true)
				.leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")

				.whereNull("car_rentals.deleted_at")
				.leftJoin("car_rental_pivots", function () {
					this.on("car_rental_reservations.car_rental_id", "=", "car_rental_pivots.car_rental_id").andOn("car_rental_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "car_rentals.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("car_rental_packages", "car_rental_reservations.package_id", "car_rental_packages.id")
				.leftJoin("car_rental_package_pivots", function () {
					this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id").andOn("car_rental_package_pivots.language_code", "=", knex.raw("?", [language]))
				})

				.modify(qb => {
					// Filtreler
					if (typeof status !== "undefined") qb.where("car_rental_reservations.status", status)
					if (car_rental_id) qb.where("car_rental_reservations.car_rental_id", car_rental_id)
					if (start_date) qb.where("car_rental_reservations.created_at", ">=", start_date)
					if (end_date) qb.where("car_rental_reservations.created_at", "<=", end_date)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("car_rental_pivots.title", "ilike", like).orWhere("city_pivots.name", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("car_rental_reservations.id", "ilike", like).orWhere("car_rental_reservations.progress_id", "ilike", like).orWhere("car_rental_package_pivots.name", "ilike", like)
						})
					}
				})

			// Toplam sayım
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct("car_rental_reservations.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi - misafir bilgileri ve fotoğraf ile birlikte
			const data = await base
				.clone()
				.select(
					"car_rental_reservations.*",
					"car_rental_pivots.title as car_rental_title",
					"city_pivots.name as car_rental_city",
					"country_pivots.name as car_rental_country",
					"car_rental_package_pivots.name as package_name"
					// Car rental fotoğrafı için subquery - ilk fotoğraf
					// knex.raw(`(
					// 	SELECT image_url
					// 	FROM car_rental_galleries
					// 	WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
					// 	AND car_rental_galleries.deleted_at IS NULL
					// 	ORDER BY car_rental_galleries.created_at ASC
					// 	LIMIT 1
					// ) as car_rental_image`),
				)
				.groupBy("car_rental_reservations.id", "car_rental_pivots.title", "city_pivots.name", "country_pivots.name", "car_rental_package_pivots.name")
				.orderBy("car_rental_reservations.created_at", "desc")
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
					car_rental_location: `${item.car_rental_country || ""}, ${item.car_rental_city || ""}`.trim(),
					created_at_formatted: item.created_at ? new Date(item.created_at).toLocaleDateString(locale) : null,
					start_date_formatted: item.start_date ? new Date(item.start_date).toLocaleDateString(locale) : null,
					end_date_formatted: item.end_date ? new Date(item.end_date).toLocaleDateString(locale) : null,
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

			const reservation = await knex("car_rental_reservations")
				.select(
					"car_rental_reservations.*",
					"car_rental_pivots.title as car_rental_title",
					"city_pivots.name as car_rental_city",
					"country_pivots.name as car_rental_country",
					"car_rental_package_pivots.name as package_name",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
						SELECT image_url
						FROM car_rental_galleries
						WHERE car_rental_galleries.car_rental_id = car_rental_reservations.car_rental_id
						AND car_rental_galleries.deleted_at IS NULL
						ORDER BY car_rental_galleries.created_at ASC
						LIMIT 1
					) as car_rental_image`),
					knex.raw(
						"COALESCE(json_agg(DISTINCT jsonb_build_object('id', car_rental_reservation_users.id, 'name', car_rental_reservation_users.name, 'surname', car_rental_reservation_users.surname, 'email', car_rental_reservation_users.email, 'phone', car_rental_reservation_users.phone, 'type', car_rental_reservation_users.type, 'age', car_rental_reservation_users.age)) FILTER (WHERE car_rental_reservation_users.id IS NOT NULL), '[]'::json) as guests"
					)
				)
				.where("car_rental_reservations.id", id)
				.whereNull("car_rental_reservations.deleted_at")
				.leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")

				.whereNull("car_rentals.deleted_at")
				.leftJoin("car_rental_pivots", function () {
					this.on("car_rental_reservations.car_rental_id", "=", "car_rental_pivots.car_rental_id").andOn("car_rental_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "car_rentals.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})

				.leftJoin("car_rental_packages", "car_rental_reservations.package_id", "car_rental_packages.id")
				.leftJoin("car_rental_package_pivots", function () {
					this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id").andOn("car_rental_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("car_rental_reservation_users", "car_rental_reservations.id", "car_rental_reservation_users.car_rental_reservation_id")
				.whereNull("car_rental_reservation_users.deleted_at")
				.groupBy("car_rental_reservations.id", "car_rental_pivots.title", "city_pivots.name", "country_pivots.name", "car_rental_package_pivots.name")
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
				car_rental_location: `${reservation.car_rental_country || ""}, ${reservation.car_rental_city || ""}`.trim(),
				created_at_formatted: reservation.created_at ? new Date(reservation.created_at).toLocaleDateString(locale) : null,
				updated_at_formatted: reservation.updated_at ? new Date(reservation.updated_at).toLocaleDateString(locale) : null,
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
