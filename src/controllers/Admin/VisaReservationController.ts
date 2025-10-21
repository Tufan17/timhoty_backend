import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"

export default class VisaReservationController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				status,
				visa_id,
				start_date,
				end_date,
			} = req.query as {
				page: number
				limit: number
				search: string
				status?: boolean
				visa_id?: string
				start_date?: string
				end_date?: string
			}

			const language = (req as any).language

			const base = knex("visa_reservations")
				.whereNull("visa_reservations.deleted_at")
				.leftJoin("visas", "visa_reservations.visa_id", "visas.id")

				.where("visa_reservations.status", true)
				.whereNull("visas.deleted_at")
				.leftJoin("visa_pivots", function () {
					this.on("visa_reservations.visa_id", "=", "visa_pivots.visa_id").andOn("visa_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "visas.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.modify(qb => {
					// Filtreler
					if (typeof status !== "undefined") qb.where("visa_reservations.status", status)
					if (visa_id) qb.where("visa_reservations.visa_id", visa_id)
					if (start_date) qb.where("visa_reservations.created_at", ">=", start_date)
					if (end_date) qb.where("visa_reservations.created_at", "<=", end_date)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("visa_pivots.title", "ilike", like).orWhere("city_pivots.name", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("visa_reservations.id", "ilike", like).orWhere("visa_reservations.progress_id", "ilike", like)
						})
					}
				})

			// Toplam sayım
			const countRow = await base.clone().clearSelect().clearOrder().count<{ total: string }>("visa_reservations.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi - misafir bilgileri ile birlikte
			const data = await base
				.clone()
				.select(
					"visa_reservations.progress_id",
					"visa_reservations.id",
					"visa_reservations.status",
					"visa_reservations.created_at",
					"visa_reservations.price",
					"visa_reservations.currency_code",
					"visa_pivots.title as visa_title",
					"city_pivots.name as visa_city",
					"country_pivots.name as visa_country"
					// Vize fotoğrafı için subquery
					// 	knex.raw(`(
					//   SELECT image_url
					//   FROM visa_galleries
					//   WHERE visa_galleries.visa_id = visa_reservations.visa_id
					//   AND visa_galleries.deleted_at IS NULL
					//   ORDER BY visa_galleries.created_at ASC
					//   LIMIT 1
					// ) as visa_image`)
				)
				.groupBy("visa_reservations.id", "visa_pivots.title", "city_pivots.name", "country_pivots.name")
				.orderBy("visa_reservations.created_at", "desc")
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
					visa_location: `${item.visa_country || ""}, ${item.visa_city || ""}`.trim(),
					created_at_formatted: item.created_at ? new Date(item.created_at).toLocaleDateString(locale) : null,
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

			const reservation = await knex("visa_reservations")
				.select(
					"visa_reservations.*",
					"visa_pivots.title as visa_title",
					"city_pivots.name as visa_city",
					"country_pivots.name as visa_country",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
						SELECT image_url
						FROM visa_galleries
						WHERE visa_galleries.visa_id = visa_reservations.visa_id
						AND visa_galleries.deleted_at IS NULL
						ORDER BY visa_galleries.created_at ASC
						LIMIT 1
					) as visa_image`),
					knex.raw("COALESCE(json_agg(DISTINCT jsonb_build_object('id', visa_reservation_users.id, 'name', visa_reservation_users.name, 'surname', visa_reservation_users.surname, 'email', visa_reservation_users.email, 'phone', visa_reservation_users.phone, 'type', visa_reservation_users.type,'age', visa_reservation_users.age)) FILTER (WHERE visa_reservation_users.id IS NOT NULL), '[]'::json) as guests")
				)
				.where("visa_reservations.id", id)
				.whereNull("visa_reservations.deleted_at")
				.leftJoin("visas", "visa_reservations.visa_id", "visas.id")

				.whereNull("visas.deleted_at")
				.leftJoin("visa_pivots", function () {
					this.on("visa_reservations.visa_id", "=", "visa_pivots.visa_id").andOn("visa_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("cities", "visas.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("visa_reservation_users", "visa_reservations.id", "visa_reservation_users.visa_reservation_id")
				.whereNull("visa_reservation_users.deleted_at")
				.groupBy("visa_reservations.id", "visa_pivots.title", "city_pivots.name", "country_pivots.name")
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
				visa_location: `${reservation.visa_country || ""}, ${reservation.visa_city || ""}`.trim(),
				created_at_formatted: reservation.created_at ? new Date(reservation.created_at).toLocaleDateString(locale) : null,
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
