import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"

export default class HotelReservationController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				status,
				hotel_id,
				start_date,
				end_date,
			} = req.query as {
				page: number
				limit: number
				search: string
				status?: boolean
				hotel_id?: string
				start_date?: string
				end_date?: string
			}

			const language = (req as any).language

			// Base query - admin'in görebileceği rezervasyonlar
			const base = knex("hotel_reservations")
				.whereNull("hotel_reservations.deleted_at")
				.leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")

				.where("hotel_reservations.status", true)
				.whereNull("hotels.deleted_at")
				.leftJoin("sales_partners", "hotel_reservations.sales_partner_id", "sales_partners.id")
				.leftJoin("hotel_pivots", function () {
					this.on("hotel_reservations.hotel_id", "=", "hotel_pivots.hotel_id").andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "hotels.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.modify(qb => {
					// Filtreler
					if (typeof status !== "undefined") qb.where("hotel_reservations.status", status)
					if (hotel_id) qb.where("hotel_reservations.hotel_id", hotel_id)
					if (start_date) qb.where("hotel_reservations.start_date", ">=", start_date)
					if (end_date) qb.where("hotel_reservations.end_date", "<=", end_date)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("hotel_pivots.name", "ilike", like).orWhere("city_pivots.name", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("hotel_reservations.id", "ilike", like)
						})
					}
				})

			// Toplam sayım
			const countRow = await base.clone().clearSelect().clearOrder().count<{ total: string }>("hotel_reservations.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi - misafir bilgileri ile birlikte
			const data = await base
				.clone()
				.select(
					"hotel_reservations.progress_id",
					"hotel_reservations.id",
					"hotel_reservations.status",
					"hotel_reservations.start_date",
					"hotel_reservations.end_date",
					"hotel_reservations.price",
					"hotel_reservations.currency_code",
					"hotel_reservations.check_in_date",
					"hotel_reservations.sales_partner_id",
					"sales_partners.name as sales_partner_name",
					"hotel_pivots.name as hotel_name",
					"city_pivots.name as hotel_city",
					"country_pivots.name as hotel_country"
				)
				// .leftJoin("hotel_reservation_users", "hotel_reservations.id", "hotel_reservation_users.hotel_reservation_id")
				// .whereNull("hotel_reservation_users.deleted_at")
				.groupBy("hotel_reservations.id", "hotel_pivots.name", "city_pivots.name", "country_pivots.name", "sales_partners.name")
				.orderBy("hotel_reservations.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const formattedData = data.map((item: any) => {
				const { sales_partner_name, ...rest } = item
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
					...rest,
					sales_partner_name,
					hotel_location: `${rest.hotel_country || ""}, ${rest.hotel_city || ""}`.trim(),
					start_date_formatted: rest.start_date ? new Date(rest.start_date).toLocaleDateString(locale) : null,
					end_date_formatted: rest.end_date ? new Date(rest.end_date).toLocaleDateString(locale) : null,
					// Eğer check_in_date varsa onu da formatla
					check_in_date_formatted: rest.check_in_date ? new Date(rest.check_in_date).toLocaleDateString(locale) : null,
					price_formatted: formatPrice(rest.price, rest.currency_code),
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

			const reservation = await knex("hotel_reservations")
				.select(
					"hotel_reservations.*",
					"sales_partners.name as sales_partner_name",
					"hotel_pivots.name as hotel_name",
					"city_pivots.name as hotel_city",
					"country_pivots.name as hotel_country",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
						SELECT image_url
						FROM hotel_galleries
						WHERE hotel_galleries.hotel_id = hotel_reservations.hotel_id
						AND hotel_galleries.deleted_at IS NULL
						ORDER BY hotel_galleries.created_at ASC
						LIMIT 1
					) as hotel_image`),
					knex.raw("json_agg(DISTINCT jsonb_build_object('id', hotel_reservation_users.id, 'name', hotel_reservation_users.name, 'surname', hotel_reservation_users.surname, 'email', hotel_reservation_users.email, 'phone', hotel_reservation_users.phone, 'type', hotel_reservation_users.type,'age', hotel_reservation_users.age)) as guests")
				)
				.where("hotel_reservations.id", id)
				.whereNull("hotel_reservations.deleted_at")
				.leftJoin("hotels", "hotel_reservations.hotel_id", "hotels.id")

				.whereNull("hotels.deleted_at")
				.leftJoin("sales_partners", "hotel_reservations.sales_partner_id", "sales_partners.id")
				.leftJoin("hotel_pivots", function () {
					this.on("hotel_reservations.hotel_id", "=", "hotel_pivots.hotel_id").andOn("hotel_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "hotels.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("hotel_reservation_users", "hotel_reservations.id", "hotel_reservation_users.hotel_reservation_id")
				.whereNull("hotel_reservation_users.deleted_at")
				.groupBy("hotel_reservations.id", "hotel_pivots.name", "city_pivots.name", "country_pivots.name", "sales_partners.name")
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
			const { sales_partner_name, ...reservationRest } = reservation as any
			const salesPartner = reservationRest.sales_partner_id
				? {
					id: reservationRest.sales_partner_id,
					name: sales_partner_name,
				}
				: null

			const formattedReservation = {
				...reservationRest,
				sales_partner: salesPartner,
				hotel_location: `${reservationRest.hotel_country || ""}, ${reservationRest.hotel_city || ""}`.trim(),
				start_date_formatted: reservationRest.start_date ? new Date(reservationRest.start_date).toLocaleDateString(locale) : null,
				end_date_formatted: reservationRest.end_date ? new Date(reservationRest.end_date).toLocaleDateString(locale) : null,
				check_in_date_formatted: reservationRest.check_in_date ? new Date(reservationRest.check_in_date).toLocaleDateString(locale) : null,
				price_formatted: formatPrice(reservationRest.price, reservationRest.currency_code),
				guest_count: reservationRest.guests?.length || 0,
				// Ek formatlamalar
				created_at_formatted: reservationRest.created_at ? new Date(reservationRest.created_at).toLocaleDateString(locale) : null,
				updated_at_formatted: reservationRest.updated_at ? new Date(reservationRest.updated_at).toLocaleDateString(locale) : null,
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
