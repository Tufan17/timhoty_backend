import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import TourGroupAskModel from "@/models/TourGroupAskModel"

export default class TourGroupAskController {
	/**
	 * DataTable with pagination, search and filtering
	 */
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				tour_id,
				status,
			} = req.query as {
				page: number
				limit: number
				search: string
				tour_id?: string
				status?: boolean
			}

			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.ACCESS_DENIED"),
					data: null,
				})
			}

			// Base query - only tour group asks for this solution partner's tours
			const base = knex("tour_group_asks")
				.whereNull("tour_group_asks.deleted_at")
				.innerJoin("tours", "tour_group_asks.tour_id", "tours.id")
				.where("tours.solution_partner_id", spFromUser)
				.whereNull("tours.deleted_at")
				.modify(qb => {
					// Filter by status if provided
					if (typeof status !== "undefined") qb.where("tour_group_asks.status", status)
				})

			// Total count
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("tour_group_asks.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			const data = await base
				.select(["tour_group_asks.*", "tours.night_count", "tours.day_count"])
				.orderBy("tour_group_asks.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			// Get tour titles for each record
			const language = (req as any).language
			for (const item of data) {
				const tourPivot = await knex("tour_pivots").where("tour_id", item.tour_id).where("language_code", language).whereNull("deleted_at").select("title").first()

				item.tour_title = tourPivot?.title || null
			}

			return res.send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ALL_SUCCESS"),
				data,
				recordsPerPageOptions: [10, 20, 50, 100],
				total,
				totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.error("TourGroupAsk dataTable error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ALL_ERROR"),
				data: null,
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id
			const language = (req as any).language

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.ACCESS_DENIED"),
					data: null,
				})
			}

			// Get tour group ask with tour info
			const tourGroupAsk = await knex("tour_group_asks").where("tour_group_asks.id", id).whereNull("tour_group_asks.deleted_at").innerJoin("tours", "tour_group_asks.tour_id", "tours.id").where("tours.solution_partner_id", spFromUser).whereNull("tours.deleted_at").select(["tour_group_asks.*", "tours.night_count", "tours.day_count", "tours.solution_partner_id"]).first()

			if (!tourGroupAsk) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_NOT_FOUND"),
					data: null,
				})
			}

			// Get tour title
			const tourPivot = await knex("tour_pivots").where("tour_id", tourGroupAsk.tour_id).where("language_code", language).whereNull("deleted_at").select("title").first()

			tourGroupAsk.tour_title = tourPivot?.title || null

			// Get user info if user_id exists
			if (tourGroupAsk.user_id) {
				const user = await knex("users").where("id", tourGroupAsk.user_id).whereNull("deleted_at").select("id", "name", "email", "phone").first()

				tourGroupAsk.user = user || null
			}

			return res.send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ONE_SUCCESS"),
				data: tourGroupAsk,
			})
		} catch (error) {
			console.error("TourGroupAsk findOne error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ONE_ERROR"),
				data: null,
			})
		}
	}

	/**
	 * Update tour group ask (answer and status)
	 */
	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { status, answer } = req.body as {
				status?: boolean
				answer?: string
			}

			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.ACCESS_DENIED"),
					data: null,
				})
			}

			// Check if anything to update
			if (typeof status === "undefined" && typeof answer === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.NO_UPDATE_DATA"),
				})
			}

			// Check if tour group ask exists and belongs to this solution partner
			const existingTourGroupAsk = await knex("tour_group_asks").where("tour_group_asks.id", id).whereNull("tour_group_asks.deleted_at").innerJoin("tours", "tour_group_asks.tour_id", "tours.id").where("tours.solution_partner_id", spFromUser).whereNull("tours.deleted_at").select("tour_group_asks.*").first()

			if (!existingTourGroupAsk) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_NOT_FOUND"),
					data: null,
				})
			}

			// Prepare update data
			const updateData: any = {}
			if (typeof status !== "undefined") updateData.status = status
			if (answer) updateData.answer = answer

			// Update tour group ask
			const updatedTourGroupAsk = await new TourGroupAskModel().update(id, updateData)

			return res.send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_UPDATED_SUCCESS"),
				data: updatedTourGroupAsk,
			})
		} catch (error) {
			console.error("TourGroupAsk update error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.ACCESS_DENIED"),
					data: null,
				})
			}

			// Check if tour group ask exists and belongs to this solution partner
			const existingTourGroupAsk = await knex("tour_group_asks").where("tour_group_asks.id", id).whereNull("tour_group_asks.deleted_at").innerJoin("tours", "tour_group_asks.tour_id", "tours.id").where("tours.solution_partner_id", spFromUser).whereNull("tours.deleted_at").select("tour_group_asks.*").first()

			if (!existingTourGroupAsk) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_NOT_FOUND"),
					data: null,
				})
			}

			await new TourGroupAskModel().delete(id)

			return res.send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_DELETED_SUCCESS"),
				data: null,
			})
		} catch (error) {
			console.error("TourGroupAsk delete error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_DELETED_ERROR"),
				data: null,
			})
		}
	}

	/**
	 * Find all tour group asks (simple list without pagination)
	 */
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR_GROUP_ASK.ACCESS_DENIED"),
					data: null,
				})
			}

			const tourGroupAsks = await knex("tour_group_asks")
				.whereNull("tour_group_asks.deleted_at")
				.innerJoin("tours", "tour_group_asks.tour_id", "tours.id")
				.where("tours.solution_partner_id", spFromUser)
				.whereNull("tours.deleted_at")
				.select(["tour_group_asks.id", "tour_group_asks.name", "tour_group_asks.email", "tour_group_asks.phone", "tour_group_asks.user_count", "tour_group_asks.date", "tour_group_asks.status", "tour_group_asks.created_at"])
				.orderBy("tour_group_asks.created_at", "desc")

			return res.send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ALL_SUCCESS"),
				data: tourGroupAsks,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_FIND_ALL_ERROR"),
			})
		}
	}
}
