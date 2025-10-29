import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import VisaFeatureModel from "@/models/VisaFeatureModel"
import VisaFeaturePivotModel from "@/models/VisaFeaturePivotModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import VisaModel from "@/models/VisaModel"

export default class VisaFeatureController {
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
			const base = knex("visa_features")
				.whereNull("visa_features.deleted_at")
				.innerJoin("visa_feature_pivots", "visa_features.id", "visa_feature_pivots.visa_feature_id")
				.innerJoin("visas", "visa_features.visa_id", "visas.id")
				.where("visa_feature_pivots.language_code", language)
				.whereNull("visa_feature_pivots.deleted_at")
				.whereNull("visas.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("visas.solution_partner_id", spFromUser)

					if (visa_id) qb.where("visa_features.visa_id", visa_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("visa_feature_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("visa_features.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("visa_features.id")
				.select("visa_features.*", "visa_feature_pivots.name", "visas.location_id")
				.orderBy("visa_features.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_SUCCESS"),
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
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { visa_id } = req.query as { visa_id?: string }

			let query = knex("visa_features").whereNull("visa_features.deleted_at").select("visa_features.*", "visa_feature_pivots.name").innerJoin("visa_feature_pivots", "visa_features.id", "visa_feature_pivots.visa_feature_id").where("visa_feature_pivots.language_code", language).whereNull("visa_feature_pivots.deleted_at")

			if (visa_id) {
				query = query.where("visa_features.visa_id", visa_id)
			}

			const visaFeatures = await query

			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_SUCCESS"),
				data: visaFeatures,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const visaFeature = await knex("visa_features").whereNull("visa_features.deleted_at").where("visa_features.id", id).select("visa_features.*", "visa_feature_pivots.name").innerJoin("visa_feature_pivots", "visa_features.id", "visa_feature_pivots.visa_feature_id").where("visa_feature_pivots.language_code", language).whereNull("visa_feature_pivots.deleted_at").first()

			if (!visaFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_FEATURE.VISA_FEATURE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_SUCCESS"),
				data: visaFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_FEATURE.VISA_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				visa_id,
				name,
				status = true,
			} = req.body as {
				visa_id: string
				name: string
				status?: boolean
			}

			const existVisa = await new VisaModel().findId(visa_id)
			if (!existVisa) {
				return res.status(400).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}

			// Validate hotel_id
			const existingFeature = await new VisaFeatureModel().existFeature({
				visa_id,
				name,
			})

			if (existingFeature) {
				return res.status(400).send({
					success: false,
					message: req.t("VISA_FEATURE.VISA_FEATURE_ALREADY_EXISTS"),
				})
			}

			// Create hotel feature
			const visaFeature = await new VisaFeatureModel().create({
				visa_id,
				status,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "visa_feature_pivots",
				target_id_key: "visa_feature_id",
				target_id: visaFeature.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			visaFeature.visa_feature_pivots = translateResult
			await new VisaModel().update(visa_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_CREATED_SUCCESS"),
				data: visaFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_FEATURE.VISA_FEATURE_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { visa_id, name, status } = req.body as {
				visa_id?: string
				name?: string
				status?: boolean
			}

			const existingVisaFeature = await new VisaFeatureModel().first({ id })

			if (!existingVisaFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_FEATURE.VISA_FEATURE_NOT_FOUND"),
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

			// Update hotel feature if hotel_id or status is provided
			if (visa_id || status !== undefined) {
				await new VisaFeatureModel().update(id, {
					...(visa_id && { visa_id }),
					...(status !== undefined && { status }),
				})
			}

			// Update translations if name is provided
			if (name) {
				await translateUpdate({
					target: "visa_feature_pivots",
					target_id_key: "visa_feature_id",
					target_id: id,
					data: {
						name,
					},
					language_code: (req as any).language,
				})
			}

			const updatedVisaFeature = await new VisaFeatureModel().oneToMany(id, "visa_feature_pivots", "visa_feature_id")
			await new VisaModel().update(existingVisaFeature.visa_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_UPDATED_SUCCESS"),
				data: updatedVisaFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_FEATURE.VISA_FEATURE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingVisaFeature = await new VisaFeatureModel().first({ id })

			if (!existingVisaFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_FEATURE.VISA_FEATURE_NOT_FOUND"),
				})
			}

			await new VisaFeatureModel().delete(id)
			await knex("visa_feature_pivots").where("visa_feature_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("VISA_FEATURE.VISA_FEATURE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_FEATURE.VISA_FEATURE_DELETED_ERROR"),
			})
		}
	}
}
