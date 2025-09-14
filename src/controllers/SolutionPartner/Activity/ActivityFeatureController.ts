import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityFeatureModel from "@/models/ActivityFeatureModel"
import ActivityFeaturePivotModel from "@/models/ActivityFeaturePivotModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import ActivityModel from "@/models/ActivityModel"

export default class ActivityFeatureController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				activity_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				activity_id?: string
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("activity_features")
				.whereNull("activity_features.deleted_at")
				.innerJoin("activity_feature_pivots", "activity_features.id", "activity_feature_pivots.activity_feature_id")
				.innerJoin("activities", "activity_features.activity_id", "activities.id")
				.where("activity_feature_pivots.language_code", language)
				.whereNull("activity_feature_pivots.deleted_at")
				.whereNull("activities.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("activities.solution_partner_id", spFromUser)

					if (activity_id) qb.where("activity_features.activity_id", activity_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_feature_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activity_features.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("activity_features.id")
				.select("activity_features.*", "activity_feature_pivots.name", "activities.location_id")
				.orderBy("activity_features.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_SUCCESS"),
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
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { activity_id } = req.query as { activity_id?: string }

			let query = knex("activity_features").whereNull("activity_features.deleted_at").select("activity_features.*", "activity_feature_pivots.name").innerJoin("activity_feature_pivots", "activity_features.id", "activity_feature_pivots.activity_feature_id").where("activity_feature_pivots.language_code", language).whereNull("activity_feature_pivots.deleted_at")

			if (activity_id) {
				query = query.where("activity_features.activity_id", activity_id)
			}

			const activityFeatures = await query

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_SUCCESS"),
				data: activityFeatures,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const activityFeature = await knex("activity_features").whereNull("activity_features.deleted_at").where("activity_features.id", id).select("activity_features.*", "activity_feature_pivots.name").innerJoin("activity_feature_pivots", "activity_features.id", "activity_feature_pivots.activity_feature_id").where("activity_feature_pivots.language_code", language).whereNull("activity_feature_pivots.deleted_at").first()

			if (!activityFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_SUCCESS"),
				data: activityFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				activity_id,
				name,
				status = true,
			} = req.body as {
				activity_id: string
				name: string
				status?: boolean
			}

			const existActivity = await new ActivityModel().findId(activity_id)
			if (!existActivity) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
				})
			}

			// Validate activity_id
			const existingFeature = await new ActivityFeatureModel().existFeature({
				activity_id,
				name,
			})

			if (existingFeature) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_ALREADY_EXISTS"),
				})
			}

			// Create activity feature
			const activityFeature = await new ActivityFeatureModel().create({
				activity_id,
				status,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "activity_feature_pivots",
				target_id_key: "activity_feature_id",
				target_id: activityFeature.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			activityFeature.activity_feature_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_CREATED_SUCCESS"),
				data: activityFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { activity_id, name, status } = req.body as {
				activity_id?: string
				name?: string
				status?: boolean
			}

			const existingActivityFeature = await new ActivityFeatureModel().first({
				id,
			})

			if (!existingActivityFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_NOT_FOUND"),
				})
			}

			// Validate activity_id if provided
			if (activity_id) {
				const existingActivity = await new ActivityModel().first({
					"activities.id": activity_id,
				})

				if (!existingActivity) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
					})
				}
			}

			// Update activity feature if activity_id or status is provided
			if (activity_id || status !== undefined) {
				await new ActivityFeatureModel().update(id, {
					...(activity_id && { activity_id }),
					...(status !== undefined && { status }),
				})
			}

			// Update translations if name is provided
			if (name) {
				await translateUpdate({
					target: "activity_feature_pivots",
					target_id_key: "activity_feature_id",
					target_id: id,
					data: {
						name,
					},
					language_code: (req as any).language,
				})
			}

			const updatedActivityFeature = await new ActivityFeatureModel().oneToMany(id, "activity_feature_pivots", "activity_feature_id")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_UPDATED_SUCCESS"),
				data: updatedActivityFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingActivityFeature = await new ActivityFeatureModel().first({
				id,
			})

			if (!existingActivityFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_NOT_FOUND"),
				})
			}

			await new ActivityFeatureModel().delete(id)
			await knex("activity_feature_pivots").where("activity_feature_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_FEATURE.ACTIVITY_FEATURE_DELETED_ERROR"),
			})
		}
	}
}
