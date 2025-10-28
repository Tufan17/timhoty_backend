import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import CarRentalFeatureModel from "@/models/CarRentalFeatureModel"
import CarRentalFeaturePivotModel from "@/models/CarRentalFeaturePivotModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import CarRentalModel from "@/models/CarRentalModel"

export default class CarRentalFeatureController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				car_rental_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				car_rental_id?: string
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("car_rental_features")
				.whereNull("car_rental_features.deleted_at")
				.innerJoin("car_rental_feature_pivots", "car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id")
				.innerJoin("car_rentals", "car_rental_features.car_rental_id", "car_rentals.id")
				.where("car_rental_feature_pivots.language_code", language)
				.whereNull("car_rental_feature_pivots.deleted_at")
				.whereNull("car_rentals.deleted_at")
				.modify(qb => {
					// Filter by solution partner from authenticated user
					if (spFromUser) qb.where("car_rentals.solution_partner_id", spFromUser)

					if (car_rental_id) qb.where("car_rental_features.car_rental_id", car_rental_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("car_rental_feature_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("car_rental_features.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("car_rental_features.id")
				.select("car_rental_features.*", "car_rental_feature_pivots.name", "car_rentals.location_id")
				.orderBy("car_rental_features.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_SUCCESS"),
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
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { car_rental_id } = req.query as { car_rental_id?: string }

			let query = knex("car_rental_features").whereNull("car_rental_features.deleted_at").select("car_rental_features.*", "car_rental_feature_pivots.name").innerJoin("car_rental_feature_pivots", "car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id").where("car_rental_feature_pivots.language_code", language).whereNull("car_rental_feature_pivots.deleted_at")

			if (car_rental_id) {
				query = query.where("car_rental_features.car_rental_id", car_rental_id)
			}

			const carRentalFeatures = await query

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_SUCCESS"),
				data: carRentalFeatures,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			const carRentalFeature = await knex("car_rental_features")
				.whereNull("car_rental_features.deleted_at")
				.where("car_rental_features.id", id)
				.select("car_rental_features.*", "car_rental_feature_pivots.name")
				.innerJoin("car_rental_feature_pivots", "car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id")
				.where("car_rental_feature_pivots.language_code", language)
				.whereNull("car_rental_feature_pivots.deleted_at")
				.first()

			if (!carRentalFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_SUCCESS"),
				data: carRentalFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				car_rental_id,
				name,
				status = true,
			} = req.body as {
				car_rental_id: string
				name: string
				status?: boolean
			}

			const existCarRental = await new CarRentalModel().findId(car_rental_id)
			if (!existCarRental) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
				})
			}

			// Validate hotel_id
			const existingFeature = await new CarRentalFeatureModel().existFeature({
				car_rental_id,
				name,
			})

			if (existingFeature) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_ALREADY_EXISTS"),
				})
			}

			// Create hotel feature
			const carRentalFeature = await new CarRentalFeatureModel().create({
				car_rental_id,
				status,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "car_rental_feature_pivots",
				target_id_key: "car_rental_feature_id",
				target_id: carRentalFeature.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			carRentalFeature.car_rental_feature_pivots = translateResult
			await new CarRentalModel().update(car_rental_id, {
				status: false,
				admin_approval: false,
			})
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_CREATED_SUCCESS"),
				data: carRentalFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { car_rental_id, name, status } = req.body as {
				car_rental_id?: string
				name?: string
				status?: boolean
			}

			const existingCarRentalFeature = await new CarRentalFeatureModel().first({
				id,
			})

			if (!existingCarRentalFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_NOT_FOUND"),
				})
			}

			// Validate hotel_id if provided
			if (car_rental_id) {
				const existingCarRental = await new CarRentalModel().first({
					"car_rentals.id": car_rental_id,
				})

				if (!existingCarRental) {
					return res.status(400).send({
						success: false,
						message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
					})
				}
			}

			// Update hotel feature if hotel_id or status is provided
			if (car_rental_id || status !== undefined) {
				await new CarRentalFeatureModel().update(id, {
					...(car_rental_id && { car_rental_id }),
					...(status !== undefined && { status }),
				})
			}

			// Update translations if name is provided
			if (name) {
				await translateUpdate({
					target: "car_rental_feature_pivots",
					target_id_key: "car_rental_feature_id",
					target_id: id,
					data: {
						name,
					},
					language_code: (req as any).language,
				})
			}

			const updatedCarRentalFeature = await new CarRentalFeatureModel().oneToMany(id, "car_rental_feature_pivots", "car_rental_feature_id")
			await new CarRentalModel().update(existingCarRentalFeature.car_rental_id, {
				status: false,
				admin_approval: false,
			})
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_UPDATED_SUCCESS"),
				data: updatedCarRentalFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingCarRentalFeature = await new CarRentalFeatureModel().first({
				id,
			})

			if (!existingCarRentalFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_NOT_FOUND"),
				})
			}

			await new CarRentalFeatureModel().delete(id)
			await knex("car_rental_feature_pivots").where("car_rental_feature_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_FEATURE.CAR_RENTAL_FEATURE_DELETED_ERROR"),
			})
		}
	}
}
