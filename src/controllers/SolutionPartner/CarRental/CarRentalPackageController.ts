import { FastifyReply, FastifyRequest } from "fastify"
import CarRentalPackagePriceModel from "@/models/CarRentalPackagePriceModel"
import knex from "@/db/knex"
import CarRentalPackageModel from "@/models/CarRentalPackageModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import CarRentalModel from "@/models/CarRentalModel"

interface CreatePackageBody {
	car_rental_id: string
	discount?: number
	total_tax_amount?: number
	constant_price: boolean
	name: string
	description: string
	refund_policy: string
	return_acceptance_period: number
	prices: Array<{
		main_price: number
		child_price?: number
		currency_id: string
		start_date?: string
		end_date?: string
	}>
}

interface UpdatePackageBody {
	discount?: number
	total_tax_amount?: number
	constant_price?: boolean
	return_acceptance_period?: number
	name?: string
	description?: string
	refund_policy?: string
	prices?: Array<{
		main_price: number
		child_price?: number
		currency_id: string
		start_date?: string
		end_date?: string
	}>
}

export class CarRentalPackageController {
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
				car_rental_id: string
			}

			const query = knex("car_rental_packages")
				.whereNull("car_rental_packages.deleted_at")
				.where("car_rental_packages.car_rental_id", car_rental_id)
				.leftJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.whereNull("car_rental_package_prices.deleted_at")
				.where(function () {
					if (search) {
						const like = `%${search}%`
						this.where(function () {
							this.where("car_rental_packages.discount", "ilike", like).orWhere("car_rental_packages.total_tax_amount", "ilike", like)

							if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
								this.orWhere("car_rental_packages.constant_price", search.toLowerCase() === "true")
							}
						})
					}
				})
				.select("car_rental_packages.*", knex.raw("json_agg(car_rental_package_prices.*) as prices"))
				.groupBy("car_rental_packages.id")

			const countResult = await knex("car_rental_packages").whereNull("deleted_at").where("car_rental_id", car_rental_id).count("* as total").first()
			const total = Number(countResult?.total ?? 0)

			const offset = (page - 1) * limit
			const packages = await query.limit(limit).offset(offset)

			return res.send({
				data: packages,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			})
		} catch (error) {
			console.error("Error in dataTable:", error)
			return res.status(500).send({
				message: req.t("GENERAL.ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_id } = req.query as { car_rental_id: string }

			const packages = await knex
				.select(
					"car_rental_packages.*",
					knex.raw(`
            json_agg(
              json_build_object(
                'id', car_rental_package_prices.id,
                'car_rental_package_id', car_rental_package_prices.car_rental_package_id,
                'main_price', car_rental_package_prices.main_price,
                'child_price', car_rental_package_prices.child_price,
                'currency_id', car_rental_package_prices.currency_id,
                'start_date', car_rental_package_prices.start_date,
                'end_date', car_rental_package_prices.end_date,
                'created_at', car_rental_package_prices.created_at,
                'updated_at', car_rental_package_prices.updated_at,
                'deleted_at', car_rental_package_prices.deleted_at
              )
            ) as prices
          `),
					"car_rental_package_pivots.name",
					"car_rental_package_pivots.description",
					"car_rental_package_pivots.refund_policy"
				)
				.from("car_rental_packages")
				.innerJoin("car_rental_package_pivots", "car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
				.where("car_rental_package_pivots.language_code", req.language)
				.leftJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.where("car_rental_packages.car_rental_id", car_rental_id)
				.whereNull("car_rental_packages.deleted_at")
				.groupBy("car_rental_packages.id", "car_rental_package_pivots.name", "car_rental_package_pivots.description", "car_rental_package_pivots.refund_policy")

			return res.send(packages)
		} catch (error) {
			console.error("Error in findAll:", error)
			return res.status(500).send({
				message: req.t("GENERAL.ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const packageModel = await knex
				.select(
					"car_rental_packages.*",
					knex.raw(`
            json_agg(
              json_build_object(
                'id', car_rental_package_prices.id,
                'car_rental_package_id', car_rental_package_prices.car_rental_package_id,
                'main_price', car_rental_package_prices.main_price,
                'child_price', car_rental_package_prices.child_price,
                'currency_id', car_rental_package_prices.currency_id,
                'currency_name', currency_pivots.name,
                'code', currencies.code,
                'start_date', car_rental_package_prices.start_date,
                'end_date', car_rental_package_prices.end_date,
                'created_at', car_rental_package_prices.created_at,
                'updated_at', car_rental_package_prices.updated_at,
                'deleted_at', car_rental_package_prices.deleted_at
              )
            ) as prices
          `),
					"car_rental_package_pivots.name",
					"car_rental_package_pivots.description",
					"car_rental_package_pivots.refund_policy",
					"currencies.code"
				)
				.from("car_rental_packages")
				.innerJoin("car_rental_package_pivots", "car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
				.where("car_rental_package_pivots.language_code", req.language)
				.innerJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.where("car_rental_packages.id", id)
				.whereNull("car_rental_package_prices.deleted_at")
				.whereNull("car_rental_packages.deleted_at")
				.innerJoin("currency_pivots", "car_rental_package_prices.currency_id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", req.language)
				.innerJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
				.groupBy("car_rental_packages.id", "car_rental_package_pivots.name", "car_rental_package_pivots.description", "car_rental_package_pivots.refund_policy", "currencies.code")
				.first()

			const carRentalPackageImages = await knex("car_rental_package_images").where("car_rental_package_images.car_rental_package_id", id).whereNull("car_rental_package_images.deleted_at").select("car_rental_package_images.*")
			packageModel.car_rental_package_images = carRentalPackageImages

			const carRentalPackageFeatures = await knex("car_rental_package_features")
				.where("car_rental_package_features.car_rental_package_id", id)
				.innerJoin("car_rental_package_feature_pivots", "car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
				.where("car_rental_package_feature_pivots.language_code", req.language)
				.whereNull("car_rental_package_features.deleted_at")
				.select("car_rental_package_features.*", "car_rental_package_feature_pivots.name")

			packageModel.car_rental_package_features = carRentalPackageFeatures

			if (!packageModel) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				data: packageModel,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("GENERAL.ERROR"),
			})
		}
	}
	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_id, discount, total_tax_amount, constant_price, name, description, refund_policy, return_acceptance_period, prices } = req.body as CreatePackageBody

			const existingCarRental = await new CarRentalModel().exists({
				id: car_rental_id,
			})

			if (!existingCarRental) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.CAR_RENTAL_PACKAGE_NOT_FOUND"),
				})
			}

			// tarihlerler kendli içinde çakışıyor mu ve constant_price true ise prices sadece 1 tane olmalı
			if (constant_price) {
				if (prices.length > 1) {
					return res.status(400).send({
						success: false,
						message: req.t("CAR_RENTAL_PACKAGE.PRICE_COUNT_ERROR"),
					})
				}
			}

			// tarihlerler kendli içinde çakışıyor mu
			let conflict = false
			if (prices.length > 1) {
				for (const price of prices) {
					for (const price2 of prices) {
						if (price.start_date && price2.start_date && price.end_date && price2.end_date) {
							if (price !== price2 && new Date(price.start_date) >= new Date(price2.start_date) && new Date(price.start_date) <= new Date(price2.end_date)) {
								conflict = true
							}
						}
					}
				}
			}
			if (conflict) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.DATE_RANGE_ERROR"),
				})
			}
			const packageModel = await new CarRentalPackageModel().create({
				car_rental_id,
				discount,
				total_tax_amount,
				constant_price,
				return_acceptance_period,
			})

			const translateResult = await translateCreate({
				target: "car_rental_package_pivots",
				target_id_key: "car_rental_package_id",
				target_id: packageModel.id,
				language_code: (req as any).language,
				data: {
					name,
					description,
					refund_policy,
				},
			})

			let pricesModel = []
			for (const price of prices) {
				const priceModel = await new CarRentalPackagePriceModel().create({
					car_rental_package_id: packageModel.id,
					main_price: price.main_price,
					child_price: price.child_price,
					currency_id: price.currency_id,
					start_date: price.start_date,
					end_date: price.end_date,
				})
				pricesModel.push(priceModel)
			}

			packageModel.prices = pricesModel
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE.CREATED_SUCCESS"),
				data: packageModel,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("GENERAL.ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: number }
			const { car_rental_id, discount, total_tax_amount, constant_price, return_acceptance_period, prices, name, description, refund_policy } = req.body as CreatePackageBody

			const packageModel = await knex
				.select("car_rental_packages.*", knex.raw("json_agg(car_rental_package_prices.*) as prices"))
				.from("car_rental_packages")
				.leftJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.where("car_rental_packages.id", id)
				.whereNull("car_rental_package_prices.deleted_at")
				.whereNull("car_rental_packages.deleted_at")
				.groupBy("car_rental_packages.id")
				.first()

			if (!packageModel) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}

			// constant_price true ise prices sadece 1 tane olmalı
			if (constant_price) {
				if (prices.length > 1) {
					return res.status(400).send({
						success: false,
						message: req.t("CAR_RENTAL_PACKAGE.PRICE_COUNT_ERROR"),
					})
				}
			}

			await translateUpdate({
				target: "car_rental_package_pivots",
				target_id: id.toString(),
				target_id_key: "car_rental_package_id",
				language_code: (req as any).language,
				data: {
					name,
					description,
					refund_policy,
				},
			})

			// tarihlerler kendli içinde çakışıyor mu
			let conflict = false
			if (prices.length > 1) {
				for (const price of prices) {
					for (const price2 of prices) {
						if (price.start_date && price2.start_date && price.end_date && price2.end_date) {
							if (price !== price2 && new Date(price.start_date) >= new Date(price2.start_date) && new Date(price.start_date) <= new Date(price2.end_date)) {
								conflict = true
							}
						}
					}
				}
			}
			if (conflict) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.DATE_RANGE_ERROR"),
				})
			}

			// Update package
			await knex("car_rental_packages")
				.update({
					car_rental_id,
					discount,
					total_tax_amount,
					constant_price,
					return_acceptance_period,
				})
				.where("id", id)
				.whereNull("deleted_at")

			// Delete old prices
			await knex("car_rental_package_prices").del().where("car_rental_package_id", id).whereNull("deleted_at")

			// Create new prices
			let pricesModel = []
			for (const price of prices) {
				const priceModel = await new CarRentalPackagePriceModel().create({
					car_rental_package_id: id,
					main_price: price.main_price,
					child_price: price.child_price,
					currency_id: price.currency_id,
					start_date: price.start_date,
					end_date: price.end_date,
				})
				pricesModel.push(priceModel)
			}

			// Get updated package with prices
			const updatedPackage = await knex
				.select("car_rental_packages.*", knex.raw("json_agg(car_rental_package_prices.*) as prices"))
				.from("car_rental_packages")
				.leftJoin("car_rental_package_prices", "car_rental_packages.id", "car_rental_package_prices.car_rental_package_id")
				.where("car_rental_packages.id", id)
				.whereNull("car_rental_package_prices.deleted_at")
				.whereNull("car_rental_packages.deleted_at")
				.groupBy("car_rental_packages.id")
				.first()

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE.UPDATED_SUCCESS"),
				data: updatedPackage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("GENERAL.ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }

			// Check if package exists
			const existingPackage = await knex("car_rental_packages").where("id", id).whereNull("deleted_at").first()

			if (!existingPackage) {
				return res.status(404).send({
					message: req.t("GENERAL.NOT_FOUND"),
				})
			}

			// Soft delete package
			await knex("car_rental_packages").where("id", id).update({ deleted_at: knex.fn.now() })

			// Soft delete pivot
			await knex("car_rental_package_pivots").where("car_rental_package_id", id).update({ deleted_at: knex.fn.now() })

			// Soft delete prices
			await knex("car_rental_package_prices").where("car_rental_package_id", id).update({ deleted_at: knex.fn.now() })

			return res.send({
				message: req.t("GENERAL.DELETED"),
			})
		} catch (error) {
			console.error("Error in delete:", error)
			return res.status(500).send({
				message: req.t("GENERAL.ERROR"),
			})
		}
	}
}
