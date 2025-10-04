import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityPackageOpportunityModel from "@/models/ActivityPackageOpportunityModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import ActivityPackageModel from "@/models/ActivityPackageModel"

export default class ActivityPackageOpportunityController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				activity_package_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				activity_package_id?: string
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("activity_package_opportunities")
				.whereNull("activity_package_opportunities.deleted_at")
				.innerJoin("activity_package_opportunity_pivots", "activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
				.innerJoin("activity_packages", "activity_package_opportunities.activity_package_id", "activity_packages.id")
				.where("activity_package_opportunity_pivots.language_code", language)
				.whereNull("activity_package_opportunity_pivots.deleted_at")
				.whereNull("activity_packages.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("activity_packages.solution_partner_id", spFromUser)

					if (activity_package_id) qb.where("activity_package_opportunities.activity_package_id", activity_package_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_package_opportunity_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activity_package_opportunities.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("activity_package_opportunities.id")
				.select("activity_package_opportunities.*", "activity_package_opportunity_pivots.name", "activity_packages.location_id")
				.orderBy("activity_package_opportunities.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
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
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { activity_package_id } = req.query as { activity_package_id?: string }

			let query = knex("activity_package_opportunities")
				.whereNull("activity_package_opportunities.deleted_at")
				.select("activity_package_opportunities.*", "activity_package_opportunity_pivots.name")
				.innerJoin("activity_package_opportunity_pivots", "activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
				.where("activity_package_opportunity_pivots.language_code", language)
				.whereNull("activity_package_opportunity_pivots.deleted_at")

			if (activity_package_id) {
				query = query.where("activity_package_opportunities.activity_package_id", activity_package_id)
			}

			const activityPackageOpportunities = await query

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
				data: activityPackageOpportunities,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const ActivityPackageOpportunity = await knex("activity_package_opportunities")
				.whereNull("activity_package_opportunities.deleted_at")
				.where("activity_package_opportunities.id", id)
				.select("activity_package_opportunities.*", "activity_package_opportunity_pivots.name")
				.innerJoin("activity_package_opportunity_pivots", "activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
				.where("activity_package_opportunity_pivots.language_code", language)
				.whereNull("activity_package_opportunity_pivots.deleted_at")
				.first()

			if (!ActivityPackageOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_SUCCESS"),
				data: ActivityPackageOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id, name } = req.body as {
				activity_package_id: string
				name: string
			}
			console.log(activity_package_id)
			const existActivityPackage = await new ActivityPackageModel().findId(activity_package_id)
			if (!existActivityPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
				})
			}

			// Validate activity_package_id
			const existingActivityPackageOpportunity = await new ActivityPackageOpportunityModel().existOpportunity({
				activity_package_id,
				name,
			})

			if (existingActivityPackageOpportunity) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_ALREADY_EXISTS"),
				})
			}

			// Create activity_package_opportunity
			const ActivityPackageOpportunity = await new ActivityPackageOpportunityModel().create({
				activity_package_id,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "activity_package_opportunity_pivots",
				target_id_key: "activity_package_opportunity_id",
				target_id: ActivityPackageOpportunity.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			ActivityPackageOpportunity.activity_package_opportunity_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_CREATED_SUCCESS"),
				data: ActivityPackageOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { activity_package_id, name } = req.body as {
				activity_package_id?: string
				name?: string
			}

			const existingActivityPackageOpportunity = await new ActivityPackageOpportunityModel().first({ id })

			if (!existingActivityPackageOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_NOT_FOUND"),
				})
			}

			// Validate activity_package_id if provided
			if (activity_package_id) {
				const existingActivityPackage = await new ActivityPackageModel().first({
					"activity_packages.id": activity_package_id,
				})

				if (!existingActivityPackage) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
					})
				}
			}

			// Update activity_package_opportunity if activity_package_id is provided
			if (activity_package_id) {
				await new ActivityPackageOpportunityModel().update(id, {
					activity_package_id: activity_package_id !== undefined ? activity_package_id : existingActivityPackageOpportunity.activity_package_id,
				})
			}

			// Update translations if provided
			if (name) {
				await translateUpdate({
					target: "activity_package_opportunity_pivots",
					target_id_key: "activity_package_opportunity_id",
					target_id: id,
					data: {
						...(name && { name }),
					},
					language_code: (req as any).language,
				})
			}

			const updatedActivityPackageOpportunity = await new ActivityPackageOpportunityModel().oneToMany(id, "activity_package_opportunity_pivots", "activity_package_opportunity_id")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_UPDATED_SUCCESS"),
				data: updatedActivityPackageOpportunity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingActivityPackageOpportunity = await new ActivityPackageOpportunityModel().first({ id })

			if (!existingActivityPackageOpportunity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_NOT_FOUND"),
				})
			}

			await new ActivityPackageOpportunityModel().delete(id)
			await knex("activity_package_opportunity_pivots").where("activity_package_opportunity_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_OPPORTUNITY.ACTIVITY_PACKAGE_OPPORTUNITY_DELETED_ERROR"),
			})
		}
	}
}
