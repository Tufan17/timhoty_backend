import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import HotelModel from "@/models/HotelModel"

export default class HotelController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				location_id,
				solution_partner_id,
				status,
				admin_approval,
				highlight,
			} = req.query as {
				page: number
				limit: number
				search: string
				location_id?: string
				solution_partner_id?: string
				status?: boolean
				admin_approval?: boolean
				highlight?: boolean
			}
			// console.log(req.query)

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Ortak JOIN'ler
			const base = knex("hotels")
				.whereNull("hotels.deleted_at")
				.innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
				.innerJoin("cities", "hotels.location_id", "cities.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("hotel_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.where("city_pivots.language_code", language)
				.whereNull("cities.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("city_pivots.deleted_at")
				.whereNull("hotel_pivots.deleted_at")
				.modify(qb => {
					// solution_partner_id (önce user'dan, yoksa query)
					if (spFromUser) qb.where("hotels.solution_partner_id", spFromUser)
					else if (solution_partner_id) qb.where("hotels.solution_partner_id", solution_partner_id)
					if (typeof status !== "undefined") qb.where("hotels.status", status)
					if (typeof admin_approval !== "undefined") qb.where("hotels.admin_approval", admin_approval)
					if (typeof highlight !== "undefined") qb.where("hotels.highlight", highlight)
					if (location_id) qb.where("hotels.location_id", location_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("hotel_pivots.name", "ilike", like).orWhere("hotel_pivots.general_info", "ilike", like).orWhere("hotel_pivots.hotel_info", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("city_pivots.name", "ilike", like)
						})

						// "true"/"false" metni status filtresine eşlensin (opsiyonel)
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("hotels.status", sv === "true")
						}
					}
				})

			// Toplam sayım (benzersiz otel)
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("hotels.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi
			const data = await base
				.clone()
				.distinct("hotels.id") // aynı otel birden fazla pivot kaydına düşmesin
				.select("hotels.*", knex.ref("hotel_pivots.name").as("name"), "hotel_pivots.general_info", "hotel_pivots.hotel_info", "hotel_pivots.refund_policy", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"))
				.orderBy("hotels.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
				data: newData,
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
				message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { status, admin_approval } = req.query as {
				status?: boolean
				admin_approval?: boolean
			}
			const language = req.language
			const hotels = await knex("hotels")
				.whereNull("hotels.deleted_at")
				.innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id")
				.innerJoin("cities", "hotels.location_id", "cities.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("hotel_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.where("city_pivots.language_code", language)
				.whereNull("cities.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("city_pivots.deleted_at")
				.whereNull("hotel_pivots.deleted_at")
				.modify(qb => {
					if (typeof status !== "undefined") qb.where("hotels.status", status)
					if (typeof admin_approval !== "undefined") qb.where("hotels.admin_approval", admin_approval)
				})
				.select("hotels.*", "hotel_pivots.name as name", "hotel_pivots.general_info", "hotel_pivots.hotel_info", "hotel_pivots.refund_policy", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"))
			const newData = hotels.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
				data: newData,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const hotel = await knex("hotels").whereNull("hotels.deleted_at").where("hotels.id", id).select("hotels.*", "hotel_pivots.name as name", "hotel_pivots.general_info", "hotel_pivots.hotel_info", "hotel_pivots.refund_policy").innerJoin("hotel_pivots", "hotels.id", "hotel_pivots.hotel_id").where("hotel_pivots.language_code", req.language).first()

			if (!hotel) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL.HOTEL_NOT_FOUND"),
				})
			}

			if (hotel.location_id) {
				const city = await knex("cities")
					.where("cities.id", hotel.location_id)
					.whereNull("cities.deleted_at")
					.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
					.where("country_pivots.language_code", req.language)
					.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
					.where("city_pivots.language_code", req.language)
					.whereNull("cities.deleted_at")
					.whereNull("country_pivots.deleted_at")
					.whereNull("city_pivots.deleted_at")
					.select("country_pivots.name as country_name", "city_pivots.name as city_name")
					.first()
				hotel.location = city
				hotel.address = `${city.country_name}, ${city.city_name}`
			}

			const hotelOpportunities = await knex("hotel_opportunities")
				.where("hotel_opportunities.hotel_id", id)
				.whereNull("hotel_opportunities.deleted_at")
				.innerJoin("hotel_opportunity_pivots", "hotel_opportunities.id", "hotel_opportunity_pivots.hotel_opportunity_id")
				.where("hotel_opportunity_pivots.language_code", req.language)
				.select("hotel_opportunities.*", "hotel_opportunity_pivots.category", "hotel_opportunity_pivots.description")
			hotel.hotel_opportunities = hotelOpportunities

			const hotelFeatures = await knex("hotel_features").where("hotel_features.hotel_id", id).whereNull("hotel_features.deleted_at").innerJoin("hotel_feature_pivots", "hotel_features.id", "hotel_feature_pivots.hotel_feature_id").where("hotel_feature_pivots.language_code", req.language).select("hotel_features.*", "hotel_feature_pivots.name")
			hotel.hotel_features = hotelFeatures

			const hotelRooms = await knex("hotel_rooms").where("hotel_rooms.hotel_id", id).whereNull("hotel_rooms.deleted_at").innerJoin("hotel_room_pivots", "hotel_rooms.id", "hotel_room_pivots.hotel_room_id").where("hotel_room_pivots.language_code", req.language).select("hotel_rooms.*", "hotel_room_pivots.name", "hotel_room_pivots.description", "hotel_room_pivots.refund_policy")

			// Her room için packages ve prices'ları ayrı ayrı getir
			for (const room of hotelRooms) {
				const packages = await knex("hotel_room_packages").where("hotel_room_packages.hotel_room_id", room.id).whereNull("hotel_room_packages.deleted_at").select("*")

				for (const pkg of packages) {
					const prices = await knex("hotel_room_package_prices").where("hotel_room_package_prices.hotel_room_package_id", pkg.id).whereNull("hotel_room_package_prices.deleted_at").leftJoin("currencies", "hotel_room_package_prices.currency_id", "currencies.id").select("hotel_room_package_prices.*", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
					pkg.prices = prices
				}
				room.packages = packages
			}

			hotel.hotel_rooms = hotelRooms

			const hotelGalleries = await knex("hotel_galleries").where("hotel_galleries.hotel_id", id).whereNull("hotel_galleries.deleted_at").leftJoin("hotel_gallery_pivot", "hotel_galleries.id", "hotel_gallery_pivot.hotel_gallery_id").where("hotel_gallery_pivot.language_code", req.language).whereNull("hotel_gallery_pivot.deleted_at").select("hotel_galleries.*", "hotel_gallery_pivot.category")
			hotel.hotel_galleries = hotelGalleries

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL.HOTEL_FETCHED_SUCCESS"),
				data: hotel,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL.HOTEL_FETCHED_ERROR"),
			})
		}
	}

	async updateAdminApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { admin_approval, status } = req.body as {
				admin_approval: boolean
				status: boolean
			}

			// Admin approval değeri zorunlu
			if (typeof admin_approval === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingHotel = await new HotelModel().first({ id })

			if (!existingHotel) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL.HOTEL_NOT_FOUND"),
				})
			}

			// Sadece admin_approval değerini güncelle
			await new HotelModel().update(id, {
				admin_approval: admin_approval,
				status: status,
			})

			const updatedHotel = await new HotelModel().oneToMany(id, "hotel_pivots", "hotel_id")

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedHotel,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
}
