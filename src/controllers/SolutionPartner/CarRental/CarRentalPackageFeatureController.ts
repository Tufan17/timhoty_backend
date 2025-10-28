import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import CarRentalPackageFeatureModel from "@/models/CarRentalPackageFeatureModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import CarRentalPackageModel from "@/models/CarRentalPackageModel"
import CarRentalModel from "@/models/CarRentalModel"

export default class CarRentalPackageFeatureController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				car_rental_package_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				car_rental_package_id?: string
			}

			const language = (req as any).language

			// Base query with JOINs
			const base = knex("car_rental_package_features")
				.whereNull("car_rental_package_features.deleted_at")
				.innerJoin("car_rental_package_feature_pivots", "car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
				.innerJoin("car_rental_packages", "car_rental_package_features.car_rental_package_id", "car_rental_packages.id")
				.where("car_rental_package_feature_pivots.language_code", language)
				.whereNull("car_rental_package_feature_pivots.deleted_at")
				.whereNull("car_rental_packages.deleted_at")
				.modify(qb => {
					if (car_rental_package_id) {
						qb.where("car_rental_package_features.car_rental_package_id", car_rental_package_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("car_rental_package_feature_pivots.name", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("car_rental_package_features.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("car_rental_package_features.id")
				.select("car_rental_package_features.*", "car_rental_package_feature_pivots.name")
				.orderBy("car_rental_package_features.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.FETCHED_SUCCESS"),
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
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { car_rental_package_id } = req.query as { car_rental_package_id?: string }

			let query = knex("car_rental_package_features")
				.whereNull("car_rental_package_features.deleted_at")
				.select("car_rental_package_features.*", "car_rental_package_feature_pivots.name")
				.innerJoin("car_rental_package_feature_pivots", "car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
				.where("car_rental_package_feature_pivots.language_code", language)
				.whereNull("car_rental_package_feature_pivots.deleted_at")

			if (car_rental_package_id) {
				query = query.where("car_rental_package_features.car_rental_package_id", car_rental_package_id)
			}

			const features = await query

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.FETCHED_SUCCESS"),
				data: features,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const feature = await knex("car_rental_package_features")
				.whereNull("car_rental_package_features.deleted_at")
				.where("car_rental_package_features.id", id)
				.select("car_rental_package_features.*", "car_rental_package_feature_pivots.name")
				.innerJoin("car_rental_package_feature_pivots", "car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
				.where("visa_package_feature_pivots.language_code", req.language)
				.first()

			if (!feature) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("VISA_PACKAGE_FEATURE.FETCHED_SUCCESS"),
				data: feature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_PACKAGE_FEATURE.FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_package_id, name, status } = req.body as {
				car_rental_package_id: string
				name: string
				status: boolean
			}

			// Validate hotel_room_id
			const existingCarRentalPackage = await new CarRentalPackageModel().first({
				id: car_rental_package_id,
			})

			if (!existingCarRentalPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}

			// Create hotel room feature
			const feature = await new CarRentalPackageFeatureModel().create({
				car_rental_package_id,
				status,
			})

			// Create translations
			const translateResult = await translateCreate({
				target: "car_rental_package_feature_pivots",
				target_id_key: "car_rental_package_feature_id",
				target_id: feature.id,
				language_code: (req as any).language,
				data: {
					name,
				},
			})

			feature.translations = translateResult

			await new CarRentalModel().update(existingCarRentalPackage.car_rental_id, {
				status: false,
				admin_approval: false,
			})
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.CREATED_SUCCESS"),
				data: feature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { car_rental_package_id, name, status } = req.body as {
				car_rental_package_id?: string
				name?: string
				status?: boolean
			}

			// Check if anything to update
			if (!car_rental_package_id && !name && status === undefined) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_FEATURE.NO_UPDATE_DATA"),
				})
			}

			// Check feature existence
			const existingFeature = await knex("car_rental_package_features").where("id", id).first()

			if (!existingFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			// Validate hotel room if hotel_room_id is provided
			if (car_rental_package_id) {
				const carRentalPackage = await knex("car_rental_packages").where("id", car_rental_package_id).first()

				if (!carRentalPackage) {
					return res.status(400).send({
						success: false,
						message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
					})
				}
			}

			// Update feature
			const updateData: any = {}
			if (car_rental_package_id) updateData.car_rental_package_id = car_rental_package_id
			if (status !== undefined) updateData.status = status

			if (Object.keys(updateData).length > 0) {
				await knex("car_rental_package_features").where("id", id).update(updateData)
			}

			// Update translations if name provided
			if (name) {
				await translateUpdate({
					target: "car_rental_package_feature_pivots",
					target_id_key: "car_rental_package_feature_id",
					target_id: id,
					data: { name },
					language_code: (req as any).language,
				})
			}

			// Get updated feature with translations
			const updatedFeature = await knex("car_rental_package_features")
				.where("car_rental_package_features.id", id)
				.select("car_rental_package_features.*", "car_rental_package_feature_pivots.name")
				.leftJoin("car_rental_package_feature_pivots", "car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
				.where("car_rental_package_feature_pivots.language_code", (req as any).language)
				.first()
			const carRentalPackage = await new CarRentalPackageModel().first({
				id: existingFeature.car_rental_package_id,
			})
			if (!carRentalPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}

			await new CarRentalModel().update(carRentalPackage.car_rental_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.UPDATED_SUCCESS"),
				data: updatedFeature,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingFeature = await new CarRentalPackageFeatureModel().exists({
				id,
			})

			if (!existingFeature) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_FEATURE.NOT_FOUND"),
				})
			}

			await new CarRentalPackageFeatureModel().delete(id)
			await knex("car_rental_package_feature_pivots").where("car_rental_package_feature_id", id).update({ deleted_at: new Date() })
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_FEATURE.DELETED_ERROR"),
			})
		}
	}
}
