import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityPackageFeatureModel from "@/models/ActivityPackageFeatureModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import ActivityPackageModel from "@/models/ActivityPackageModel"

export default class ActivityPackageFeatureController {
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

			// Base query with JOINs
			const base = knex("activity_package_features")
				.whereNull("activity_package_features.deleted_at")
				.innerJoin("activity_package_feature_pivots", "activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
				.innerJoin("activity_packages", "activity_package_features.activity_package_id", "activity_packages.id")
				.where("activity_package_feature_pivots.language_code", language)
				.whereNull("activity_package_feature_pivots.deleted_at")
				.whereNull("activity_packages.deleted_at")
				.modify(qb => {
					if (activity_package_id) {
						qb.where("activity_package_features.activity_package_id", activity_package_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_package_feature_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activity_package_features.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("activity_package_features.id")
				.select("activity_package_features.*", "activity_package_feature_pivots.name")
				.orderBy("activity_package_features.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_SUCCESS"),
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
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { activity_package_id } = req.query as { activity_package_id?: string }

			let query = knex("activity_package_features")
				.whereNull("activity_package_features.deleted_at")
				.select("activity_package_features.*", "activity_package_feature_pivots.name")
				.innerJoin("activity_package_feature_pivots", "activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
				.where("activity_package_feature_pivots.language_code", language)
				.whereNull("activity_package_feature_pivots.deleted_at")

			if (activity_package_id) {
				query = query.where("activity_package_features.activity_package_id", activity_package_id)
			}

			const features = await query

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_SUCCESS"),
				data: features,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const feature = await knex("activity_package_features")
				.whereNull("activity_package_features.deleted_at")
				.where("activity_package_features.id", id)
				.select("activity_package_features.*", "activity_package_feature_pivots.name")
				.innerJoin("activity_package_feature_pivots", "activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
				.where("activity_package_feature_pivots.language_code", (req as any).language)
				.first()

			if (!feature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_SUCCESS"),
				data: feature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id, name, status } = req.body as {
				activity_package_id: string
				name: string
				status: boolean
			}

			// Validate activity_package_id
			const existingActivityPackage = await new ActivityPackageModel().exists({
				id: activity_package_id,
			})

			if (!existingActivityPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			// Create activity package feature
			const feature = await new ActivityPackageFeatureModel().create({
				activity_package_id,
				status,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "activity_package_feature_pivots",
				target_id_key: "activity_package_feature_id",
				target_id: feature.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			feature.translations = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.CREATED_SUCCESS"),
				data: feature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { activity_package_id, name, status } = req.body as {
				activity_package_id?: string
				name?: string
				status?: boolean
			}

			// Check if anything to update
			if (!activity_package_id && !name && status === undefined) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_FEATURE.NO_UPDATE_DATA"),
				})
			}

			// Check feature existence
			const existingFeature = await knex("activity_package_features").where("id", id).first()

			if (!existingFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			if (activity_package_id) {
				const activityPackage = await knex("activity_packages").where("id", activity_package_id).first()

				if (!activityPackage) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_PACKAGE_FEATURE.NOT_FOUND"),
					})
				}
			}

			// Update feature
			const updateData: any = {}
			if (activity_package_id) updateData.activity_package_id = activity_package_id
			if (status !== undefined) updateData.status = status

			if (Object.keys(updateData).length > 0) {
				await knex("activity_package_features").where("id", id).update(updateData)
			}

			// Update translations if name provided
			if (name) {
				await translateUpdate({
					target: "activity_package_feature_pivots",
					target_id_key: "activity_package_feature_id",
					target_id: id,
					data: { name },
					language_code: (req as any).language,
				})
			}

			// Get updated feature with translations
			const updatedFeature = await knex("activity_package_features")
				.where("activity_package_features.id", id)
				.select("activity_package_features.*", "activity_package_feature_pivots.name")
				.leftJoin("activity_package_feature_pivots", "activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
				.where("activity_package_feature_pivots.language_code", (req as any).language)
				.first()

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.UPDATED_SUCCESS"),
				data: updatedFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingFeature = await new ActivityPackageFeatureModel().exists({
				id,
			})

			if (!existingFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			await new ActivityPackageFeatureModel().delete(id)
			await knex("activity_package_feature_pivots").where("activity_package_feature_id", id).update({ deleted_at: new Date() })
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_FEATURE.DELETED_ERROR"),
			})
		}
	}
}
