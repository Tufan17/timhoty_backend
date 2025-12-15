import { FastifyReply, FastifyRequest } from "fastify"
import knex from "@/db/knex"
import ActivityPackageModel from "@/models/ActivityPackageModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import ActivityModel from "@/models/ActivityModel"
import ActivityPackagePriceModel from "@/models/ActivityPackagePriceModel"
import ActivityPackageHourModel from "@/models/ActivityPackageHourModel"

interface CreatePackageBody {
	activity_id: string
	discount?: number
	total_tax_amount?: number
	constant_price: boolean
	name: string
	description: string
	refund_policy: string
	return_acceptance_period: number
	start_date: string
	end_date: string
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
	start_date?: string
	end_date?: string
	prices?: Array<{
		main_price: number
		child_price?: number
		currency_id: string
		start_date?: string
		end_date?: string
	}>
}

export class ActivityPackageController {
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
				activity_id: string
			}

			const query = knex("activity_packages")
				.whereNull("activity_packages.deleted_at")
				.where("activity_packages.activity_id", activity_id)
				.leftJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
				.whereNull("activity_package_prices.deleted_at")
				.where(function () {
					if (search) {
						const like = `%${search}%`
						this.where(function () {
							this.where("activity_packages.discount", "ilike", like).orWhere("activity_packages.total_tax_amount", "ilike", like)

							if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
								this.orWhere("activity_packages.constant_price", search.toLowerCase() === "true")
							}
						})
					}
				})
				.select("activity_packages.*", knex.raw("json_agg(activity_package_prices.*) as prices"))
				.groupBy("activity_packages.id")

			const countResult = await knex("activity_packages").whereNull("deleted_at").where("activity_id", activity_id).count("* as total").first()
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
			const { activity_id } = req.query as { activity_id: string }

			const packages = await knex
				.select(
					"activity_packages.*",
					knex.raw(`
            json_agg(
              json_build_object(
                  'id', activity_package_prices.id,
                'activity_package_id', activity_package_prices.activity_package_id,
                'main_price', activity_package_prices.main_price,
                'child_price', activity_package_prices.child_price,
                'currency_id', activity_package_prices.currency_id,
                'start_date', activity_package_prices.start_date,
                  'end_date', activity_package_prices.end_date,
                'created_at', activity_package_prices.created_at,
                'updated_at', activity_package_prices.updated_at,
                'deleted_at', activity_package_prices.deleted_at
              )
            ) as prices
          `),
					"activity_package_pivots.name",
					"activity_package_pivots.description",
					"activity_package_pivots.refund_policy"
				)
				.from("activity_packages")
				.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
				.where("activity_package_pivots.language_code", req.language)
				.leftJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
				.where("activity_packages.activity_id", activity_id)
				.whereNull("activity_packages.deleted_at")
				.groupBy("activity_packages.id", "activity_package_pivots.name", "activity_package_pivots.description", "activity_package_pivots.refund_policy")

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

			// The previous query failed because of referencing "tour_package.date" in the JSON aggregation,
			// but there is no such table alias. We'll fix this by removing the invalid reference and only using available columns.

			const packageModel = await knex
				.select(
					"activity_packages.*",
					"activity_packages.start_date",
					knex.raw(`
            json_agg(
              json_build_object(
                'id', activity_package_prices.id,
                'activity_package_id', activity_package_prices.activity_package_id,
                'main_price', activity_package_prices.main_price,
                'child_price', activity_package_prices.child_price,
                'currency_id', activity_package_prices.currency_id,
                'currency_name', currency_pivots.name,
                'code', currencies.code,
                'start_date', activity_package_prices.start_date,
                'end_date', activity_package_prices.end_date,
                'created_at', activity_package_prices.created_at,
                'updated_at', activity_package_prices.updated_at,
                'deleted_at', activity_package_prices.deleted_at
              )
            ) as prices
          `),
					"activity_package_pivots.name",
					"activity_package_pivots.description",
					"activity_package_pivots.refund_policy"
				)
				.from("activity_packages")
				.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
				.where("activity_package_pivots.language_code", req.language)
				.innerJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
				.where("activity_packages.id", id)
				.whereNull("activity_package_prices.deleted_at")
				.whereNull("activity_packages.deleted_at")
				.innerJoin("currency_pivots", "activity_package_prices.currency_id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", req.language)
				.innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
				.groupBy("activity_packages.id", "activity_packages.start_date", "activity_package_pivots.name", "activity_package_pivots.description", "activity_package_pivots.refund_policy")
				.first()

			// Optionally, you can fetch images and features as before if needed

			if (!packageModel) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.NOT_FOUND"),
				})
			}

			// ActivityPackage için dahil/hariç özelliklerini getir (yeni yapı)
			const activityPackageFeatures = await knex("services_included_excluded")
				.where("services_included_excluded.service_id", id)
				.where("services_included_excluded.service_type", "activity")
				.where("services_included_excluded.type", "package")
				.whereNull("services_included_excluded.deleted_at")
				.innerJoin("included_excluded", "services_included_excluded.included_excluded_id", "included_excluded.id")
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [(req as any).language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("services_included_excluded.id", "services_included_excluded.included_excluded_id", "services_included_excluded.type", "services_included_excluded.status", "included_excluded_pivot.name")
			packageModel.activity_package_features = activityPackageFeatures

			const activityPackageImages = await knex("activity_package_images").where("activity_package_images.activity_package_id", id).whereNull("activity_package_images.deleted_at").select("activity_package_images.*")
			packageModel.activity_package_images = activityPackageImages

			const activityPackageOpportunities = await knex("activity_package_opportunities")
				.where("activity_package_opportunities.activity_package_id", id)
				.whereNull("activity_package_opportunities.deleted_at")
				.innerJoin("activity_package_opportunity_pivots", "activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
				.where("activity_package_opportunity_pivots.language_code", (req as any).language)
				.whereNull("activity_package_opportunity_pivots.deleted_at")
				.select("activity_package_opportunities.*", "activity_package_opportunity_pivots.name")
			packageModel.activity_package_opportunities = activityPackageOpportunities
			const activityPackageHours = await knex("activity_package_hours").where("activity_package_hours.activity_package_id", id).whereNull("activity_package_hours.deleted_at").select("activity_package_hours.*")
			packageModel.activity_package_hours = activityPackageHours

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
			const { activity_id, discount, total_tax_amount, constant_price, name, description, refund_policy, return_acceptance_period, prices, start_date, end_date } = req.body as CreatePackageBody

			const existingActivity = await new ActivityModel().exists({
				id: activity_id,
			})

			if (!existingActivity) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
				})
			}

			// tarihlerler kendli içinde çakışıyor mu ve constant_price true ise prices sadece 1 tane olmalı
			if (constant_price) {
				if (prices.length > 1) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_PACKAGE.PRICE_COUNT_ERROR"),
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
					message: req.t("ACTIVITY_PACKAGE.DATE_RANGE_ERROR"),
				})
			}
			const packageModel = await new ActivityPackageModel().create({
				activity_id,
				discount,
				total_tax_amount,
				constant_price,
				return_acceptance_period,
				start_date,
				end_date,
			})

			await translateCreate({
				target: "activity_package_pivots",
				target_id_key: "activity_package_id",
				target_id: packageModel.id,
				language_code: (req as any).language,
				data: {
					name,
					description,
					refund_policy,
				},
			})

			let pricesModel = []
			for (const price of prices || []) {
				const priceModel = await new ActivityPackagePriceModel().create({
					activity_package_id: packageModel.id,
					main_price: price.main_price,
					child_price: price.child_price,
					currency_id: price.currency_id,
					start_date: price.start_date,
					end_date: price.end_date,
				})
				pricesModel.push(priceModel)
			}

			packageModel.prices = pricesModel
			await new ActivityModel().update(activity_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE.CREATED_SUCCESS"),
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
			const { discount, total_tax_amount, constant_price, return_acceptance_period, refund_policy, name, description, prices, start_date, end_date } = req.body as UpdatePackageBody

			const packageModel = await knex.select("activity_packages.*", knex.raw("json_agg(activity_package_prices.*) as prices")).from("activity_packages").leftJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id").where("activity_packages.id", id).whereNull("activity_package_prices.deleted_at").whereNull("activity_packages.deleted_at").groupBy("activity_packages.id").first()

			if (!packageModel) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.NOT_FOUND"),
				})
			}

			// constant_price true ise prices sadece 1 tane olmalı
			if (constant_price) {
				if (prices && prices.length > 1) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_PACKAGE.PRICE_COUNT_ERROR"),
					})
				}
			}

			// tarihlerler kendli içinde çakışıyor mu
			let conflict = false
			if (prices && prices.length > 1) {
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
					message: req.t("ACTIVITY_PACKAGE.DATE_RANGE_ERROR"),
				})
			}

			await translateUpdate({
				target: "activity_package_pivots",
				target_id: id.toString(),
				target_id_key: "activity_package_id",
				language_code: (req as any).language,
				data: {
					name,
					description,
					refund_policy,
				},
			})

			// Update package
			await knex("activity_packages")
				.update({
					discount,
					total_tax_amount,
					constant_price,
					return_acceptance_period,
					start_date,
					end_date,
				})
				.where("id", id)
				.whereNull("deleted_at")

			// Delete old prices
			await knex("activity_package_prices").del().where("activity_package_id", id).whereNull("deleted_at")

			// Create new prices
			let pricesModel = []
			for (const price of prices || ([] as any)) {
				const priceModel = await new ActivityPackagePriceModel().create({
					activity_package_id: id,
					main_price: price.main_price,
					child_price: price.child_price,
					currency_id: price.currency_id,
					start_date: price.start_date,
					end_date: price.end_date,
				})
				pricesModel.push(priceModel)
			}

			// Get updated package with prices
			const updatedPackage = await knex.select("activity_packages.*", knex.raw("json_agg(activity_package_prices.*) as prices")).from("activity_packages").leftJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id").where("activity_packages.id", id).whereNull("activity_package_prices.deleted_at").whereNull("activity_packages.deleted_at").groupBy("activity_packages.id").first()
			await new ActivityModel().update(updatedPackage.activity_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE.UPDATED_SUCCESS"),
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
			const existingPackage = await knex("activity_packages").where("id", id).whereNull("deleted_at").first()

			if (!existingPackage) {
				return res.status(404).send({
					success: false,
					message: req.t("GENERAL.NOT_FOUND"),
				})
			}

			// Soft delete package
			await knex("activity_packages").where("id", id).update({ deleted_at: knex.fn.now() })

			// Soft delete pivot
			await knex("activity_package_pivots").where("activity_package_id", id).update({ deleted_at: knex.fn.now() })

			// Soft delete prices
			await knex("activity_package_prices").where("activity_package_id", id).update({ deleted_at: knex.fn.now() })

			return res.send({
				success: true,
				message: req.t("GENERAL.DELETED"),
				data: null,
				error: null,
			})
		} catch (error) {
			console.error("Error in delete:", error)
			return res.status(500).send({
				success: false,
				message: req.t("GENERAL.ERROR"),
				data: null,
				error: error,
			})
		}
	}
}
