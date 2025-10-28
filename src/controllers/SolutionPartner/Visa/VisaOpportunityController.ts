import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import VisaOpportunityModel from "@/models/VisaOpportunityModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import VisaModel from "@/models/VisaModel"

export default class VisaOpportunityController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				visa_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				visa_id?: string
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("visa_opportunities")
				.whereNull("visa_opportunities.deleted_at")
				.innerJoin("visa_opportunity_pivots", "visa_opportunities.id", "visa_opportunity_pivots.visa_opportunity_id")
				.innerJoin("visas", "visa_opportunities.visa_id", "visas.id")
				.where("visa_opportunity_pivots.language_code", language)
				.whereNull("visa_opportunity_pivots.deleted_at")
				.whereNull("visas.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("visas.solution_partner_id", spFromUser)

					if (visa_id) qb.where("visa_opportunities.visa_id", visa_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("visa_opportunity_pivots.category", "ilike", like).orWhere("visa_opportunity_pivots.description", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("visa_opportunities.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("visa_opportunities.id")
				.select("visa_opportunities.*", "visa_opportunity_pivots.category", "visa_opportunity_pivots.description", "visas.location_id")
				.orderBy("visa_opportunities.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_SUCCESS"),
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
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { visa_id } = req.query as { visa_id?: string }

			let query = knex("visa_opportunities").whereNull("visa_opportunities.deleted_at").select("visa_opportunities.*", "visa_opportunity_pivots.category", "visa_opportunity_pivots.description").innerJoin("visa_opportunity_pivots", "visa_opportunities.id", "visa_opportunity_pivots.visa_opportunity_id").where("visa_opportunity_pivots.language_code", language).whereNull("visa_opportunity_pivots.deleted_at")

			if (visa_id) {
				query = query.where("visa_opportunities.visa_id", visa_id)
			}

			const visaOpportunities = await query

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_SUCCESS"),
				data: visaOpportunities,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const visaOpportunity = await knex("visa_opportunities")
				.whereNull("visa_opportunities.deleted_at")
				.where("visa_opportunities.id", id)
				.select("visa_opportunities.*", "visa_opportunity_pivots.category", "visa_opportunity_pivots.description")
				.innerJoin("visa_opportunity_pivots", "visa_opportunities.id", "visa_opportunity_pivots.visa_opportunity_id")
				.where("visa_opportunity_pivots.language_code", language)
				.whereNull("visa_opportunity_pivots.deleted_at")
				.first()

			if (!visaOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_SUCCESS"),
				data: visaOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { visa_id, category, description } = req.body as {
				visa_id: string
				category: string
				description: string
			}
			const existVisa = await new VisaModel().findId(visa_id)
			if (!existVisa) {
				return res.status(400).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}
			await new VisaModel().update(visa_id, {
				status: false,
				admin_approval: false,
			})

			// Validate hotel_id
			const existingVisa = await new VisaOpportunityModel().exists({
				id: visa_id,
			})

			if (existingVisa) {
				return res.status(400).send({
					success: false,
					message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_ALREADY_EXISTS"),
				})
			}

			// Create hotel opportunity
			const visaOpportunity = await new VisaOpportunityModel().create({
				visa_id,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "visa_opportunity_pivots",
				target_id_key: "visa_opportunity_id",
				target_id: visaOpportunity.id,
				language_code: (req as any).language,
				data: {
					category,
					description,
				},
			})

			visaOpportunity.visa_opportunity_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_CREATED_SUCCESS"),
				data: visaOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { visa_id, category, description } = req.body as {
				visa_id?: string
				category?: string
				description?: string
			}

			const existingVisaOpportunity = await new VisaOpportunityModel().first({
				id,
			})

			if (!existingVisaOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_NOT_FOUND"),
				})
			}

			// Validate hotel_id if provided
			if (visa_id) {
				const existingVisa = await new VisaModel().first({
					"visas.id": visa_id,
				})

				if (!existingVisa) {
					return res.status(400).send({
						success: false,
						message: req.t("VISA.VISA_NOT_FOUND"),
					})
				}
			}
			await new VisaModel().update(existingVisaOpportunity.visa_id, {
				admin_approval: false,
				status: false,
			})

			// Update hotel opportunity if hotel_id is provided
			if (visa_id) {
				await new VisaOpportunityModel().update(id, {
					visa_id: visa_id !== undefined ? visa_id : existingVisaOpportunity.visa_id,
				})
			}

			// Update translations if provided
			if (category || description) {
				await translateUpdate({
					target: "visa_opportunity_pivots",
					target_id_key: "visa_opportunity_id",
					target_id: id,
					data: {
						...(category && { category }),
						...(description && { description }),
					},
					language_code: (req as any).language,
				})
			}

			const updatedVisaOpportunity = await new VisaOpportunityModel().oneToMany(id, "visa_opportunity_pivots", "visa_opportunity_id")

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_UPDATED_SUCCESS"),
				data: updatedVisaOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingVisaOpportunity = await new VisaOpportunityModel().first({
				id,
			})

			if (!existingVisaOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_NOT_FOUND"),
				})
			}

			await new VisaOpportunityModel().delete(id)
			await knex("visa_opportunity_pivots").where("visa_opportunity_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_OPPORTUNITY.VISA_OPPORTUNITY_DELETED_ERROR"),
			})
		}
	}
}
