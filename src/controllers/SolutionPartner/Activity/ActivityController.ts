import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityModel from "@/models/ActivityModel"
import ActivityPivotModel from "@/models/ActivityPivotModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import CityModel from "@/models/CityModel"
import SolutionPartnerModel from "@/models/SolutionPartnerModel"

export default class ActivityController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				location_id,
				solution_partner_id,
				status,
				admin_approval,
				highlight,
				activity_type_id,
				free_purchase,
				about_to_run_out,
			} = req.query as {
				page: number
				limit: number
				search: string
				location_id?: string
				solution_partner_id?: string
				status?: boolean
				admin_approval?: boolean
				highlight?: boolean
				activity_type_id?: string
				free_purchase?: boolean
				about_to_run_out?: boolean
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Ortak JOIN'ler
			const base = knex("activities")
				.whereNull("activities.deleted_at")
				.innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
				.innerJoin("cities", "activities.location_id", "cities.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.leftJoin("activity_types", "activities.activity_type_id", "activity_types.id")
				.leftJoin("activities_type_pivots", function () {
					this.on("activity_types.id", "activities_type_pivots.activity_type_id").andOn("activities_type_pivots.language_code", knex.raw("?", [language]))
				})
				.where("activity_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.where("city_pivots.language_code", language)
				.whereNull("cities.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("city_pivots.deleted_at")
				.whereNull("activity_pivots.deleted_at")
				.modify(qb => {
					// solution_partner_id (önce user'dan, yoksa query)
					if (spFromUser) qb.where("activities.solution_partner_id", spFromUser)
					else if (solution_partner_id) qb.where("activities.solution_partner_id", solution_partner_id)

					if (typeof status !== "undefined") qb.where("activities.status", status)
					if (typeof admin_approval !== "undefined") qb.where("activities.admin_approval", admin_approval)
					if (typeof highlight !== "undefined") qb.where("activities.highlight", highlight)
					if (typeof free_purchase !== "undefined") qb.where("activities.free_purchase", free_purchase)
					if (typeof about_to_run_out !== "undefined") qb.where("activities.about_to_run_out", about_to_run_out)
					if (location_id) qb.where("activities.location_id", location_id)
					if (activity_type_id) qb.where("activities.activity_type_id", activity_type_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_pivots.title", "ilike", like).orWhere("activity_pivots.general_info", "ilike", like).orWhere("activity_pivots.activity_info", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("city_pivots.name", "ilike", like).orWhere("activities_type_pivots.name", "ilike", like)
						})

						// "true"/"false" metni status filtresine eşlensin (opsiyonel)
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("activities.status", sv === "true")
						}
					}
				})

			// Toplam sayım (benzersiz aktivite)
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activities.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi
			const data = await base
				.clone()
				.distinct("activities.id") // aynı aktivite birden fazla pivot kaydına düşmesin
				.select("activities.*", knex.ref("activity_pivots.title").as("title"), "activity_pivots.general_info", "activity_pivots.activity_info", "activity_pivots.refund_policy", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"), knex.ref("activities_type_pivots.name").as("activity_type_name"))
				.orderBy("activities.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_SUCCESS"),
				data: newData,
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
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = req.language
			const activities = await knex("activities").whereNull("activities.deleted_at").select("activities.*", "activity_pivots.title as title", "activity_pivots.general_info", "activity_pivots.activity_info", "activity_pivots.refund_policy").innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id").where("activity_pivots.language_code", language)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_SUCCESS"),
				data: activities as any,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const activity = await knex("activities").whereNull("activities.deleted_at").where("activities.id", id).select("activities.*", "activity_pivots.title as title", "activity_pivots.general_info", "activity_pivots.activity_info", "activity_pivots.refund_policy").innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id").where("activity_pivots.language_code", req.language).first()

			if (!activity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
				})
			}

			if (activity.location_id) {
				const city = await knex("cities")
					.where("cities.id", activity.location_id)
					.whereNull("cities.deleted_at")
					.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
					.where("country_pivots.language_code", req.language)
					.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
					.where("city_pivots.language_code", req.language)
					.whereNull("cities.deleted_at")
					.whereNull("country_pivots.deleted_at")
					.whereNull("city_pivots.deleted_at")
					.select("country_pivots.name as country_name", "city_pivots.name as city_name")
					.first()
				activity.location = city
				activity.address = `${city.country_name}, ${city.city_name}`
			}

			if (activity.activity_type_id) {
				const activityType = await knex("activity_types").where("activity_types.id", activity.activity_type_id).innerJoin("activities_type_pivots", "activity_types.id", "activities_type_pivots.activity_type_id").where("activities_type_pivots.language_code", req.language).select("activity_types.*", "activities_type_pivots.name as activity_type_name").first()
				activity.activity_type = activityType
			}
			const activityFeatures = await knex("activity_features").where("activity_features.activity_id", id).innerJoin("activity_feature_pivots", "activity_features.id", "activity_feature_pivots.activity_feature_id").where("activity_feature_pivots.language_code", req.language).whereNull("activity_features.deleted_at").select("activity_features.*", "activity_feature_pivots.name")

			activity.activity_features = activityFeatures
			const activityGalleries = await knex("activity_galleries")
				.where("activity_galleries.activity_id", id)
				.whereNull("activity_galleries.deleted_at")
				.leftJoin("activity_gallery_pivots", "activity_galleries.id", "activity_gallery_pivots.activity_gallery_id")
				.where("activity_gallery_pivots.language_code", req.language)
				.whereNull("activity_gallery_pivots.deleted_at")
				.select("activity_galleries.*", "activity_gallery_pivots.category")
			activity.activity_galleries = activityGalleries

			const activityPackages = await knex("activity_packages")
				.where("activity_packages.activity_id", id)
				.leftJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
				.where("activity_package_pivots.language_code", req.language)
				.whereNull("activity_packages.deleted_at")
				.select("activity_packages.*", "activity_package_pivots.name", "activity_package_pivots.description", "activity_package_pivots.refund_policy")
			activity.activity_packages = activityPackages

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_SUCCESS"),
				data: activity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			// Get the authenticated solution partner from the request
			const solutionPartnerUser = (req as any).user

			const {
				location_id,
				activity_type_id,
				free_purchase = false,
				about_to_run_out = false,
				duration,
				map_location,
				approval_period,
				// status = false,
				// highlight = false,
				title,
				general_info,
				activity_info,
				refund_policy,
			} = req.body as {
				location_id: string
				activity_type_id: string
				free_purchase?: boolean
				about_to_run_out?: boolean
				duration: string
				map_location?: string
				approval_period?: number
				// status?: boolean
				// highlight?: boolean
				title: string
				general_info: string
				activity_info: string
				refund_policy: string
			}

			// Validate location_id
			if (location_id) {
				const existingCity = await new CityModel().first({
					"cities.id": location_id,
				})

				if (!existingCity) {
					return res.status(400).send({
						success: false,
						message: req.t("CITY.CITY_NOT_FOUND"),
					})
				}
			}

			// Validate activity_type_id
			if (activity_type_id) {
				const existingActivityType = await knex("activity_types").where("id", activity_type_id).whereNull("deleted_at").first()

				if (!existingActivityType) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_NOT_FOUND"),
					})
				}
			}

			const activity = await new ActivityModel().create({
				location_id,
				activity_type_id,
				solution_partner_id: solutionPartnerUser?.solution_partner_id,
				free_purchase,
				about_to_run_out,
				duration,
				map_location,
				approval_period,
				admin_approval: false,
				status: false,
				highlight: false,
			})

			const translateResult = await translateCreate({
				target: "activity_pivots",
				target_id_key: "activity_id",
				target_id: activity.id,
				language_code: req.language,
				data: {
					title,
					general_info,
					activity_info,
					refund_policy,
				},
			})
			activity.activity_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_CREATED_SUCCESS"),
				data: activity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { location_id, activity_type_id, free_purchase, about_to_run_out, duration, map_location, approval_period, solution_partner_id, admin_approval, title, general_info, activity_info, refund_policy } = req.body as {
				location_id?: string
				activity_type_id?: string
				free_purchase?: boolean
				about_to_run_out?: boolean
				duration?: string
				map_location?: string
				approval_period?: number
				solution_partner_id?: string
				// status?: boolean
				// highlight?: boolean
				admin_approval?: boolean
				title?: string
				general_info?: string
				activity_info?: string
				refund_policy?: string
			}

			const existingActivity = await new ActivityModel().first({ id })

			if (!existingActivity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
				})
			}

			// Validate location_id if provided
			if (location_id) {
				const existingCity = await new CityModel().first({
					"cities.id": location_id,
				})

				if (!existingCity) {
					return res.status(400).send({
						success: false,
						message: req.t("CITY.CITY_NOT_FOUND"),
					})
				}
			}

			// Validate activity_type_id if provided
			if (activity_type_id) {
				const existingActivityType = await knex("activity_types").where("id", activity_type_id).whereNull("deleted_at").first()

				if (!existingActivityType) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_NOT_FOUND"),
					})
				}
			}

			// Validate solution_partner_id if provided
			if (solution_partner_id) {
				const existingSolutionPartner = await new SolutionPartnerModel().first({
					"solution_partners.id": solution_partner_id,
				})

				if (!existingSolutionPartner) {
					return res.status(400).send({
						success: false,
						message: req.t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
					})
				}
			}

			let body: any = {
				location_id: location_id !== undefined ? location_id : existingActivity.location_id,
				activity_type_id: activity_type_id !== undefined ? activity_type_id : existingActivity.activity_type_id,
				free_purchase: free_purchase !== undefined ? free_purchase : existingActivity.free_purchase,
				about_to_run_out: about_to_run_out !== undefined ? about_to_run_out : existingActivity.about_to_run_out,
				duration: duration !== undefined ? duration : existingActivity.duration,
				map_location: map_location !== undefined ? map_location : existingActivity.map_location,
				approval_period: approval_period !== undefined ? approval_period : existingActivity.approval_period,
				solution_partner_id: solution_partner_id !== undefined ? solution_partner_id : existingActivity.solution_partner_id,
				status: false,
				highlight: false,
				// highlight: highlight !== undefined ? highlight : existingActivity.highlight,
				admin_approval: admin_approval !== undefined ? admin_approval : existingActivity.admin_approval,
			}

			await new ActivityModel().update(id, body)

			// Update translations if provided
			if (title || general_info || activity_info || refund_policy) {
				await translateUpdate({
					target: "activity_pivots",
					target_id_key: "activity_id",
					target_id: id,
					data: {
						...(title && { title }),
						...(general_info && { general_info }),
						...(activity_info && { activity_info }),
						...(refund_policy && { refund_policy }),
					},
					language_code: req.language,
				})
			}

			const updatedActivity = await new ActivityModel().oneToMany(id, "activity_pivots", "activity_id")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_UPDATED_SUCCESS"),
				data: updatedActivity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingActivity = await new ActivityModel().first({ id })

			if (!existingActivity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY.ACTIVITY_NOT_FOUND"),
				})
			}

			await new ActivityModel().delete(id)
			await knex("activity_pivots").where("activity_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_DELETED_ERROR"),
			})
		}
	}

	async sendForApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			let activity = await new ActivityModel().exists({ id })

			// Activity için gerekli olan tüm alanları kontrol et
			const activityDetails = await new ActivityModel().first({ id })

			const hasRequiredFields = activityDetails && activityDetails.duration && activityDetails.location_id && activityDetails.activity_type_id

			const hasTranslations = await knex("activity_pivots").where("activity_id", id).whereNull("deleted_at").where("title", "!=", "").whereNotNull("title").first()

			const data = {
				activity,
				hasRequiredFields,
				hasTranslations: hasTranslations ? true : false,
			}

			if (activity && hasRequiredFields && hasTranslations) {
				await new ActivityModel().update(id, {
					status: true,
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_SEND_FOR_APPROVAL_SUCCESS"),
				data,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ACTIVITY_SEND_FOR_APPROVAL_ERROR"),
			})
		}
	}
}
