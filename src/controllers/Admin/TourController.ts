import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import TourModel from "@/models/TourModel"
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel"

export default class TourController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				solution_partner_id,
				status,
				admin_approval,
				highlight,
			} = req.query as {
				page: number
				limit: number
				search: string
				solution_partner_id?: string
				status?: boolean
				admin_approval?: boolean
				highlight?: boolean
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("tours")
				.whereNull("tours.deleted_at")
				.innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
				.where("tour_pivots.language_code", language)
				.whereNull("tour_pivots.deleted_at")
				.modify(qb => {
					// solution_partner_id (first from user, then from query)
					if (spFromUser) qb.where("tours.solution_partner_id", spFromUser)
					else if (solution_partner_id) qb.where("tours.solution_partner_id", solution_partner_id)

					if (typeof status !== "undefined") qb.where("tours.status", status)
					if (typeof admin_approval !== "undefined") qb.where("tours.admin_approval", admin_approval)
					if (typeof highlight !== "undefined") qb.where("tours.highlight", highlight)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("tour_pivots.title", "ilike", like).orWhere("tour_pivots.general_info", "ilike", like).orWhere("tour_pivots.tour_info", "ilike", like).orWhere("tour_pivots.refund_policy", "ilike", like)
						})

						// Handle "true"/"false" text for status filter
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("tours.status", sv === "true")
						}
					}
				})

			// Total count
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("tours.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data with pagination
			const data = await base
				.select(["tours.*", "tour_pivots.title", "tour_pivots.general_info", "tour_pivots.tour_info", "tour_pivots.refund_policy", "tour_pivots.language_code"])
				.orderBy("tours.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.send({
				success: true,
				message: "Turlar başarıyla getirildi",
				data,
				recordsPerPageOptions: [10, 20, 50, 100],
				total,
				totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.error("Tour dataTable error:", error)
			return res.status(500).send({
				success: false,
				message: "Sunucu hatası",
				data: null,
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			const tour = await knex("tours").where("tours.id", id).whereNull("tours.deleted_at").innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id").where("tour_pivots.language_code", language).whereNull("tour_pivots.deleted_at").select(["tours.*", "tour_pivots.title", "tour_pivots.general_info", "tour_pivots.tour_info", "tour_pivots.refund_policy", "tour_pivots.language_code"]).first()

			if (!tour) {
				return res.status(404).send({
					success: false,
					message: "Tur bulunamadı",
					data: null,
				})
			}

			// Check if user has access to this tour
			if (spFromUser && tour.solution_partner_id !== spFromUser) {
				return res.status(403).send({
					success: false,
					message: "Erişim reddedildi",
					data: null,
				})
			}

			const tourGalleries = await knex("tour_galleries")
				.where("tour_galleries.tour_id", id)
				.whereNull("tour_galleries.deleted_at")
				.leftJoin("tour_gallery_pivots", "tour_galleries.id", "tour_gallery_pivots.tour_gallery_id")
				.where("tour_gallery_pivots.language_code", (req as any).language)
				.whereNull("tour_gallery_pivots.deleted_at")
				.select("tour_galleries.*", "tour_gallery_pivots.category")

			tour.tour_galleries = tourGalleries

			// Tour özellikleri (services_included_excluded tablosundan)
			const tourFeatures = await knex("services_included_excluded")
				.where("services_included_excluded.service_id", id)
				.where("services_included_excluded.service_type", "tour")
				.where("services_included_excluded.type", "normal")
				.whereNull("services_included_excluded.deleted_at")
				.innerJoin("included_excluded", "services_included_excluded.included_excluded_id", "included_excluded.id")
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [(req as any).language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("services_included_excluded.id", "services_included_excluded.included_excluded_id", "services_included_excluded.type", "services_included_excluded.status", "included_excluded_pivot.name")
			tour.tour_features = tourFeatures

			const tourPrograms = await knex("tour_programs")
				.where("tour_programs.tour_id", id)
				.whereNull("tour_programs.deleted_at")
				.innerJoin("tour_program_pivots", "tour_programs.id", "tour_program_pivots.tour_program_id")
				.where("tour_program_pivots.language_code", (req as any).language)
				.whereNull("tour_program_pivots.deleted_at")
				.orderBy("tour_programs.order", "asc")
				.select(["tour_programs.*", "tour_program_pivots.title", "tour_program_pivots.content"])
			tour.tour_programs = tourPrograms

			const tourLocations = await knex("tour_locations")
				.where("tour_locations.tour_id", id)
				.whereNull("tour_locations.deleted_at")
				.innerJoin("cities", "tour_locations.location_id", "cities.id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.where("city_pivots.language_code", (req as any).language)
				.where("country_pivots.language_code", (req as any).language)
				.whereNull("city_pivots.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.select("tour_locations.*", "city_pivots.name as city_name", "country_pivots.name as country_name", "country_pivots.country_id as country_id")
				.orderBy("tour_locations.created_at", "asc")
			tour.tour_locations = tourLocations

			const tourDeparturePoints = await knex("tour_departure_points")
				.where("tour_departure_points.tour_id", id)
				.whereNull("tour_departure_points.deleted_at")
				.innerJoin("cities", "tour_departure_points.location_id", "cities.id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.where("city_pivots.language_code", (req as any).language)
				.where("country_pivots.language_code", (req as any).language)
				.whereNull("city_pivots.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.select("tour_departure_points.*", "city_pivots.name as city_name", "country_pivots.name as country_name", "country_pivots.country_id as country_id")
				.orderBy("tour_departure_points.created_at", "asc")
			tour.tour_departure_points = tourDeparturePoints

			const tourPackages = await knex("tour_packages").where("tour_packages.tour_id", id).leftJoin("tour_package_pivots", "tour_packages.id", "tour_package_pivots.tour_package_id").where("tour_package_pivots.language_code", req.language).whereNull("tour_packages.deleted_at").select("tour_packages.*", "tour_package_pivots.name", "tour_package_pivots.description", "tour_package_pivots.refund_policy")
			for (const pkg of tourPackages) {
				const prices = await knex("tour_package_prices").where("tour_package_prices.tour_package_id", pkg.id).whereNull("tour_package_prices.deleted_at").leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id").select("tour_package_prices.*", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
				pkg.prices = prices
			}
			tour.tour_packages = tourPackages

			return res.send({
				success: true,
				message: "Tur başarıyla getirildi",
				data: tour,
			})
		} catch (error) {
			console.error("Tour findOne error:", error)
			return res.status(500).send({
				success: false,
				message: "Sunucu hatası",
				data: null,
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const { status, admin_approval } = req.query as {
				status?: boolean
				admin_approval?: boolean
			}
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			const tours = await knex("tours")
				.whereNull("tours.deleted_at")
				.modify(qb => {
					if (typeof status !== "undefined") qb.where("tours.status", status)
					if (typeof admin_approval !== "undefined") qb.where("tours.admin_approval", admin_approval)
				})
				.innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
				.where("tour_pivots.language_code", language)
				.whereNull("tour_pivots.deleted_at")
				.modify(qb => {
					if (spFromUser) {
						qb.where("tours.solution_partner_id", spFromUser)
					}
				})
				.select(["tours.id", "tours.status", "tours.highlight", "tours.night_count", "tours.day_count", "tour_pivots.title", "tour_pivots.language_code"])
				.orderBy("tours.created_at", "desc")

			return res.send({
				success: true,
				message: "Turlar başarıyla getirildi",
				data: tours,
			})
		} catch (error) {
			console.error("Tour findAll error:", error)
			return res.status(500).send({
				success: false,
				message: "Sunucu hatası",
				data: null,
			})
		}
	}
	async updateTourApproval(req: FastifyRequest, res: FastifyReply) {
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
					message: req.t("TOUR.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingTour = await new TourModel().first({ id })

			if (!existingTour) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR.NOT_FOUND"),
				})
			}

			await new TourModel().update(id, {
				admin_approval: admin_approval,
				status: status,
			})
			if (status && admin_approval) {
				// Activity onaylandı - Manager kullanıcısına onay maili gönder
				const managerUser = await new SolutionPartnerUserModel().first({
					solution_partner_id: existingTour.solution_partner_id,
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
					solution_partner_id: existingTour.solution_partner_id,
					type: "manager",
				})
				if (managerUser) {
					const language = managerUser.language_code || "tr"
					sendMailServiceRejected(managerUser.email, managerUser.name_surname, language)
				}
			}

			const updatedTour = await new TourModel().oneToMany(id, "tour_pivots", "tour_id")
			// console.log(updatedTour)

			return res.status(200).send({
				success: true,
				message: req.t("TOUR.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedTour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
	async updateTourHighlight(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { highlight } = req.body as {
				highlight: boolean
			}

			// Admin approval değeri zorunlu
			if (typeof highlight === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingTour = await new TourModel().first({ id })

			if (!existingTour) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR.NOT_FOUND"),
				})
			}

			const updatedTour = await new TourModel().update(id, {
				highlight: highlight,
			})

			return res.status(200).send({
				success: true,
				message: req.t("TOUR.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedTour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR.ADMIN_APPROVAL_UPDATED_ERROR"),
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
