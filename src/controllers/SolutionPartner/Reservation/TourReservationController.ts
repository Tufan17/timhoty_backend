import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"

export default class TourReservationController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search_term = "",
				status,
				tour_id,
				start_date,
				end_date,
				period,
			} = req.query as {
				page: number
				limit: number
				search_term: string
				status?: boolean
				tour_id?: string
				start_date?: string
				end_date?: string
				period?: string
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const solutionPartnerId = solutionPartnerUser?.solution_partner_id

			if (!solutionPartnerId) {
				return res.status(401).send({
					success: false,
					message: req.t("AUTH.UNAUTHORIZED"),
				})
			}

			const base = knex("tour_reservations")
				.whereNull("tour_reservations.deleted_at")
				.where("tour_reservations.status", true)
				.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
				.where("tours.solution_partner_id", solutionPartnerId)
				.whereNull("tours.deleted_at")
				.leftJoin("tour_pivots", function () {
					this.on("tour_reservations.tour_id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("tour_locations", "tours.id", "tour_locations.tour_id")
				.leftJoin("cities", "tour_locations.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
				.leftJoin("tour_package_pivots", function () {
					this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id").andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.modify(qb => {
					// Filtreler
					if (typeof status !== "undefined") qb.where("tour_reservations.status", status)
					if (tour_id) qb.where("tour_reservations.tour_id", tour_id)
					if (start_date) qb.where("tour_reservations.created_at", ">=", start_date)
					if (end_date) qb.where("tour_reservations.created_at", "<=", end_date)
					if (period) qb.where("tour_reservations.period", period)
					if (search_term) {
						const like = `%${search_term}%`
						qb.andWhere(w => {
							w.where("tour_pivots.title", "ilike", like).orWhereRaw("CAST(tour_reservations.id AS TEXT) ILIKE ?", [like]).orWhereRaw("CAST(tour_reservations.progress_id AS TEXT) ILIKE ?", [like])
						})
					}
				})

			// Toplam sayım
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct("tour_reservations.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi - misafir bilgileri ve fotoğraf ile birlikte
			const data = await base
				.clone()
				.select(
					"tour_reservations.*",
					"tour_pivots.title as tour_title",
					"city_pivots.name as tour_city",
					"country_pivots.name as tour_country",
					"tour_package_pivots.name as tour_package_name"
					// Tour fotoğrafı için subquery - ilk fotoğraf
					// knex.raw(`(
					// 	SELECT image_url
					// 	FROM tour_galleries
					// 	WHERE tour_galleries.tour_id = tour_reservations.tour_id
					// 	AND tour_galleries.deleted_at IS NULL
					// 	ORDER BY tour_galleries.created_at ASC
					// 	LIMIT 1
					// ) as tour_image`)
				)
				.groupBy("tour_reservations.id", "tour_pivots.title", "city_pivots.name", "country_pivots.name", "tour_package_pivots.name")
				.orderBy("tour_reservations.created_at", "desc")
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
					tour_location: `${item.tour_country || ""}, ${item.tour_city || ""}`.trim(),
					created_at_formatted: item.created_at ? new Date(item.created_at).toLocaleDateString(locale) : null,
					start_date_formatted: item.start_date ? new Date(item.start_date).toLocaleDateString(locale) : null,
					end_date_formatted: item.end_date ? new Date(item.end_date).toLocaleDateString(locale) : null,
					price_formatted: formatPrice(item.price, item.currency_code),
					tour_package_name: item.tour_package_name,
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
			const solutionPartnerUser = (req as any).user
			const solutionPartnerId = solutionPartnerUser?.solution_partner_id

			if (!solutionPartnerId) {
				return res.status(401).send({
					success: false,
					message: req.t("AUTH.UNAUTHORIZED"),
				})
			}

			const reservation = await knex("tour_reservations")
				.select(
					"tour_reservations.*",
					"tour_pivots.title as tour_title",
					"city_pivots.name as tour_city",
					"country_pivots.name as tour_country",
					"tour_package_pivots.name as tour_package_name",
					// 1 tane fotoğraf gelsin: subquery ile ilk fotoğrafı alıyoruz
					knex.raw(`(
			SELECT image_url
			FROM tour_galleries
			WHERE tour_galleries.tour_id = tour_reservations.tour_id
			AND tour_galleries.deleted_at IS NULL
			ORDER BY tour_galleries.created_at ASC
			LIMIT 1
		) as tour_image`),
					knex.raw("COALESCE(json_agg(DISTINCT jsonb_build_object('id', tour_reservation_users.id, 'name', tour_reservation_users.name, 'surname', tour_reservation_users.surname, 'email', tour_reservation_users.email, 'phone', tour_reservation_users.phone, 'type', tour_reservation_users.type,'age', tour_reservation_users.age)) FILTER (WHERE tour_reservation_users.id IS NOT NULL), '[]'::json) as guests")
				)
				.where("tour_reservations.id", id)
				.where("tour_reservations.status", true)
				.whereNull("tour_reservations.deleted_at")
				.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
				.where("tours.solution_partner_id", solutionPartnerId)
				.whereNull("tours.deleted_at")
				.leftJoin("tour_pivots", function () {
					this.on("tour_reservations.tour_id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("tour_locations", "tours.id", "tour_locations.tour_id")
				.leftJoin("cities", "tour_locations.location_id", "cities.id")
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "=", "city_pivots.city_id").andOn("city_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("countries", "cities.country_id", "countries.id")
				.leftJoin("country_pivots", function () {
					this.on("countries.id", "=", "country_pivots.country_id").andOn("country_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.leftJoin("tour_reservation_users", "tour_reservations.id", "tour_reservation_users.tour_reservation_id")
				.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
				.leftJoin("tour_package_pivots", function () {
					this.on("tour_packages.id", "=", "tour_package_pivots.tour_package_id").andOn("tour_package_pivots.language_code", "=", knex.raw("?", [language]))
				})
				.whereNull("tour_reservation_users.deleted_at")
				.groupBy("tour_reservations.id", "tour_pivots.title", "city_pivots.name", "country_pivots.name", "tour_package_pivots.name")
				.first()
			// console.log("reservation", reservation)

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
				tour_location: `${reservation.tour_country || ""}, ${reservation.tour_city || ""}`.trim(),
				created_at_formatted: reservation.created_at ? new Date(reservation.created_at).toLocaleDateString(locale) : null,
				start_date_formatted: reservation.start_date ? new Date(reservation.start_date).toLocaleDateString(locale) : null,
				end_date_formatted: reservation.end_date ? new Date(reservation.end_date).toLocaleDateString(locale) : null,
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
