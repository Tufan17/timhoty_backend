import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import HotelRoomOpportunityModel from "@/models/HotelRoomOpportunityModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import HotelRoomModel from "@/models/HotelRoomModel"
import HotelModel from "@/models/HotelModel"

export default class HotelRoomOpportunityController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				hotel_room_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				hotel_room_id?: string
			}

			const language = (req as any).language

			// Base query with JOINs
			const base = knex("hotel_room_opportunities")
				.whereNull("hotel_room_opportunities.deleted_at")
				.innerJoin("hotel_room_opportunity_pivots", "hotel_room_opportunities.id", "hotel_room_opportunity_pivots.hotel_room_opportunity_id")
				.innerJoin("hotel_rooms", "hotel_room_opportunities.hotel_room_id", "hotel_rooms.id")
				.where("hotel_room_opportunity_pivots.language_code", language)
				.whereNull("hotel_room_opportunity_pivots.deleted_at")
				.whereNull("hotel_rooms.deleted_at")
				.modify(qb => {
					if (hotel_room_id) {
						qb.where("hotel_room_opportunities.hotel_room_id", hotel_room_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("hotel_room_opportunity_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("hotel_room_opportunities.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("hotel_room_opportunities.id")
				.select("hotel_room_opportunities.*", "hotel_room_opportunity_pivots.name")
				.orderBy("hotel_room_opportunities.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_SUCCESS"),
				data,
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
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { hotel_room_id } = req.query as { hotel_room_id?: string }

			let query = knex("hotel_room_opportunities").whereNull("hotel_room_opportunities.deleted_at").select("hotel_room_opportunities.*", "hotel_room_opportunity_pivots.name").innerJoin("hotel_room_opportunity_pivots", "hotel_room_opportunities.id", "hotel_room_opportunity_pivots.hotel_room_opportunity_id").where("hotel_room_opportunity_pivots.language_code", language).whereNull("hotel_room_opportunity_pivots.deleted_at")

			if (hotel_room_id) {
				query = query.where("hotel_room_opportunities.hotel_room_id", hotel_room_id)
			}

			const opportunities = await query

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_SUCCESS"),
				data: opportunities,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const opportunity = await knex("hotel_room_opportunities")
				.whereNull("hotel_room_opportunities.deleted_at")
				.where("hotel_room_opportunities.id", id)
				.select("hotel_room_opportunities.*", "hotel_room_opportunity_pivots.name")
				.innerJoin("hotel_room_opportunity_pivots", "hotel_room_opportunities.id", "hotel_room_opportunity_pivots.hotel_room_opportunity_id")
				.where("hotel_room_opportunity_pivots.language_code", req.language)
				.first()

			if (!opportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_OPPORTUNITY.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_SUCCESS"),
				data: opportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { hotel_room_id, name } = req.body as {
				hotel_room_id: string
				name: string
			}

			// Validate hotel_room_id
			const existingHotelRoom = await new HotelRoomModel().first({
				id: hotel_room_id,
			})

			if (!existingHotelRoom) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM.NOT_FOUND"),
				})
			}

			// Create hotel room opportunity
			const opportunity = await new HotelRoomOpportunityModel().create({
				hotel_room_id,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "hotel_room_opportunity_pivots",
				target_id_key: "hotel_room_opportunity_id",
				target_id: opportunity.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			opportunity.translations = translateResult

			await new HotelModel().update(existingHotelRoom.hotel_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.CREATED_SUCCESS"),
				data: opportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { hotel_room_id, name } = req.body as {
				hotel_room_id?: string
				name?: string
			}

			// Check if anything to update
			if (!hotel_room_id && !name) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM_OPPORTUNITY.NO_UPDATE_DATA"),
				})
			}

			// Prepare parallel operations
			const operations = []

			// Check opportunity existence
			operations.push(new HotelRoomOpportunityModel().first({ id }))

			// Validate hotel room if hotel_room_id is provided
			if (hotel_room_id) {
				operations.push(new HotelRoomModel().first({ "hotel_rooms.id": hotel_room_id }))
			}

			const results = await Promise.all(operations)
			const existingOpportunity = results[0]

			if (!existingOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_OPPORTUNITY.NOT_FOUND"),
				})
			}

			// Check hotel room existence if hotel_room_id was provided
			if (hotel_room_id && !results[1]) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM.NOT_FOUND"),
				})
			}

			// Prepare update operations
			const updateOperations = []

			// Update opportunity if hotel_room_id changed
			if (hotel_room_id) {
				updateOperations.push(new HotelRoomOpportunityModel().update(id, { hotel_room_id }))
			}

			// Update translations if name provided
			if (name) {
				updateOperations.push(
					translateUpdate({
						target: "hotel_room_opportunity_pivots",
						target_id_key: "hotel_room_opportunity_id",
						target_id: id,
						data: { name },
						language_code: (req as any).language,
					})
				)
			}

			// Execute all updates in parallel
			const updateResults = await Promise.all(updateOperations)

			let updatedOpportunity = existingOpportunity
			let translations = null

			// Process results
			if (hotel_room_id) {
				updatedOpportunity = updateResults[0] || existingOpportunity
				if (name) {
					translations = updateResults[1]
				}
			} else if (name) {
				translations = updateResults[0]
			}

			// Attach translations if available
			if (translations) {
				updatedOpportunity = { ...updatedOpportunity, translations }
			}

			await new HotelModel().update(existingOpportunity.hotel_room.hotel_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.UPDATED_SUCCESS"),
				data: updatedOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingOpportunity = await new HotelRoomOpportunityModel().first({
				id,
			})

			if (!existingOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_OPPORTUNITY.NOT_FOUND"),
				})
			}

			await new HotelRoomOpportunityModel().delete(id)
			await knex("hotel_room_opportunity_pivots").where("hotel_room_opportunity_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_OPPORTUNITY.DELETED_ERROR"),
			})
		}
	}
}
