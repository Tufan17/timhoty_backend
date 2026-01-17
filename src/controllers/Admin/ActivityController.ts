import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import ActivityModel from "@/models/ActivityModel"
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel"

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
			const { status, admin_approval } = req.query as {
				status?: boolean
				admin_approval?: boolean
			}
			const activities = await knex("activities")
				.whereNull("activities.deleted_at")
				.select("activities.*", "activity_pivots.title as title", "activity_pivots.general_info", "activity_pivots.activity_info", "activity_pivots.refund_policy", "activity_pivots.language_code", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"))
				.modify(qb => {
					if (typeof status !== "undefined") qb.where("activities.status", status)
					if (typeof admin_approval !== "undefined") qb.where("activities.admin_approval", admin_approval)
				})
				.innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
				.innerJoin("cities", "activities.location_id", "cities.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("activity_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.where("city_pivots.language_code", language)
				.whereNull("cities.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("city_pivots.deleted_at")
				.whereNull("activity_pivots.deleted_at")

			const newData = activities.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
				}
			})
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ACTIVITY_FETCHED_SUCCESS"),
				data: newData,
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
			// Activity özellikleri (services_included_excluded tablosundan)
			const activityFeatures = await knex("services_included_excluded")
				.where("services_included_excluded.service_id", id)
				.where("services_included_excluded.service_type", "activity")
				.where("services_included_excluded.type", "normal")
				.whereNull("services_included_excluded.deleted_at")
				.innerJoin("included_excluded", "services_included_excluded.included_excluded_id", "included_excluded.id")
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [req.language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("services_included_excluded.id", "services_included_excluded.included_excluded_id", "services_included_excluded.type", "services_included_excluded.status", "included_excluded_pivot.name")

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

			for (const pkg of activityPackages) {
				// Fiyat bilgilerini al
				const prices = await knex("activity_package_prices").where("activity_package_prices.activity_package_id", pkg.id).whereNull("activity_package_prices.deleted_at").leftJoin("currencies", "activity_package_prices.currency_id", "currencies.id").select("activity_package_prices.*", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
				pkg.prices = prices

				// Saat bilgilerini al
				const hours = await knex("activity_package_hours").where("activity_package_hours.activity_package_id", pkg.id).whereNull("activity_package_hours.deleted_at").select("activity_package_hours.*").orderBy("hour", "asc").orderBy("minute", "asc")
				pkg.hours = hours
			}

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

	async updateActivityApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { admin_approval, status } = req.body as {
				admin_approval: boolean
				status: boolean
			}

			// Admin approval değeri zorunlu
			if (typeof admin_approval === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingActivity = await new ActivityModel().first({ id })

			if (!existingActivity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY.NOT_FOUND"),
				})
			}

			await new ActivityModel().update(id, {
				admin_approval: admin_approval,
				status: status,
			})
			if (status && admin_approval) {
				// Activity onaylandı - Manager kullanıcısına onay maili gönder
				const managerUser = await new SolutionPartnerUserModel().first({
					solution_partner_id: existingActivity.solution_partner_id,
					type: "manager",
				})
				if (managerUser) {
					const language = managerUser.language_code || "tr"
					sendMailServiceApproved(managerUser.email, managerUser.name_surname, language)
				}
			}

			if (status === false || admin_approval === false) {
				// Activity reddedildi - Manager kullanıcısına red maili gönder
				const managerUser = await new SolutionPartnerUserModel().first({
					solution_partner_id: existingActivity.solution_partner_id,
					type: "manager",
				})
				if (managerUser) {
					const language = managerUser.language_code || "tr"
					sendMailServiceRejected(managerUser.email, managerUser.name_surname, language)
				}
			}

			const updatedActivity = await new ActivityModel().oneToMany(id, "activity_pivots", "activity_id")
			// console.log(updatedActivity)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedActivity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
	async updateActivityHighlight(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { highlight } = req.body as {
				highlight: boolean
			}

			// Admin approval değeri zorunlu
			if (typeof highlight === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingActivity = await new ActivityModel().first({ id })

			if (!existingActivity) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY.NOT_FOUND"),
				})
			}

			const updatedActivity = await new ActivityModel().update(id, {
				highlight: highlight,
			})

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedActivity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
}
async function sendMailServiceApproved(email: string, nameSurname: string, language: string = "tr") {
	try {
		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")

		// Dil bazlı template dosyası seçimi
		const templateFileName = language === "en" ? "service_received_approval_solution_en.html" : "service_received_approval_solution_tr.html"

		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8")
		const uploadsUrl = process.env.UPLOADS_URL
		let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)
		html = html.replace(/\{\{name\}\}/g, nameSurname)

		// Dil bazlı email başlığı
		const emailSubject = language === "en" ? "Timhoty - Your Service Approved" : "Timhoty - Hizmetiniz Onaylandı"

		await sendMail(email, emailSubject, html)
	} catch (error) {
		console.error("Service approved email error:", error)
	}
}

async function sendMailServiceRejected(email: string, nameSurname: string, language: string = "tr") {
	try {
		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")

		// Dil bazlı template dosyası seçimi
		const templateFileName = language === "en" ? "service_received_reject_solution_en.html" : "service_received_reject_solution_tr.html"

		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8")
		const uploadsUrl = process.env.UPLOADS_URL
		let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)
		html = html.replace(/\{\{name\}\}/g, nameSurname)

		// Dil bazlı email başlığı
		const emailSubject = language === "en" ? "Timhoty - Your Service Rejected" : "Timhoty - Hizmetiniz Reddedildi"

		await sendMail(email, emailSubject, html)
	} catch (error) {
		console.error("Service rejected email error:", error)
	}
}
