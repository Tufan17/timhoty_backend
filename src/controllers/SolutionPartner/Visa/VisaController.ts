import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import CityModel from "@/models/CityModel"
import VisaModel from "@/models/VisaModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import SolutionPartnerModel from "@/models/SolutionPartnerModel"
import VisaPivotModel from "@/models/VisaPivotModel"
import VisaPackageModel from "@/models/VisaPackageModel"
import VisaGalleryModel from "@/models/VisaGalleryModel"
import VisaFeatureModel from "@/models/VisaFeatureModel"
import VisaPackagePriceModel from "@/models/VisaPackagePriceModel"
import VisaPackageImageModel from "@/models/VisaPackageImageModel"
import VisaPackageFeatureModel from "@/models/VisaPackageFeatureModel"
import CountryModel from "@/models/CountryModel"
import ServiceIncludedExcludedModel from "@/models/ServiceIncludedExcludedModal"
export default class VisaController {
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
			} = req.query as {
				page: number
				limit: number
				search: string
				location_id?: string
				solution_partner_id?: string
				status?: boolean
				admin_approval?: boolean
				highlight?: boolean
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Ortak JOIN'ler
			const base = knex("visas")
				.whereNull("visas.deleted_at")
				.innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
				.innerJoin("countries", "visas.location_id", "countries.id")
				.innerJoin("country_pivots", "countries.id", "country_pivots.country_id")

				.where("visa_pivots.language_code", language)
				.where("country_pivots.language_code", language)

				.whereNull("countries.deleted_at")
				.whereNull("country_pivots.deleted_at")

				.whereNull("visa_pivots.deleted_at")
				.modify(qb => {
					// solution_partner_id (önce user'dan, yoksa query)
					if (spFromUser) qb.where("visas.solution_partner_id", spFromUser)
					else if (solution_partner_id) qb.where("visas.solution_partner_id", solution_partner_id)

					if (typeof status !== "undefined") qb.where("visas.status", status)
					if (typeof admin_approval !== "undefined") qb.where("visas.admin_approval", admin_approval)
					if (typeof highlight !== "undefined") qb.where("visas.highlight", highlight)
					if (location_id) qb.where("visas.location_id", location_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("visa_pivots.title", "ilike", like).orWhere("visa_pivots.general_info", "ilike", like).orWhere("visa_pivots.visa_info", "ilike", like).orWhere("country_pivots.name", "ilike", like)
						})

						// "true"/"false" metni status filtresine eşlensin (opsiyonel)
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("visas.status", sv === "true")
						}
					}
				})

			// Toplam sayım (benzersiz otel)
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("visas.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi
			const data = await base
				.clone()
				.distinct("visas.id") // aynı visa birden fazla pivot kaydına düşmesin
				.select(
					"visas.*",
					"visa_pivots.title as title", // Changed from visa_pivots.name to visa_pivots.title
					"visa_pivots.general_info",
					"visa_pivots.visa_info",
					"visa_pivots.refund_policy",
					knex.ref("country_pivots.name").as("country_name")
				)
				.orderBy("visas.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}`.trim(),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_FETCHED_SUCCESS"),
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
				message: req.t("VISA.VISA_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const visas = await knex("visas").whereNull("visas.deleted_at")
			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_FETCHED_SUCCESS"),
				data: visas,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const visa = await knex("visas").whereNull("visas.deleted_at").where("visas.id", id).select("visas.*", "visa_pivots.title as title", "visa_pivots.general_info", "visa_pivots.visa_info", "visa_pivots.refund_policy").innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id").where("visa_pivots.language_code", req.language).first()

			if (!visa) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}

			if (visa.location_id) {
				const country = await knex("countries").where("countries.id", visa.location_id).whereNull("countries.deleted_at").innerJoin("country_pivots", "countries.id", "country_pivots.country_id").where("country_pivots.language_code", req.language).whereNull("country_pivots.deleted_at").select("country_pivots.name as country_name", "countries.id as country_id").first()
				visa.location = country
				visa.address = `${country.country_name}`
				visa.country_id = country.country_id
			}

			// Visa için dahil/hariç özelliklerini getir (yeni yapı)
			const visaFeatures = await knex("services_included_excluded")
				.where("services_included_excluded.service_id", id)
				.where("services_included_excluded.service_type", "visa")
				.where("services_included_excluded.type", "normal")
				.whereNull("services_included_excluded.deleted_at")
				.innerJoin("included_excluded", "services_included_excluded.included_excluded_id", "included_excluded.id")
				.innerJoin("included_excluded_pivot", function () {
					this.on("included_excluded.id", "included_excluded_pivot.included_excluded_id").andOn("included_excluded_pivot.language_code", knex.raw("?", [req.language]))
				})
				.whereNull("included_excluded_pivot.deleted_at")
				.select("services_included_excluded.id", "services_included_excluded.included_excluded_id", "services_included_excluded.type", "services_included_excluded.status", "included_excluded_pivot.name")
			visa.visa_features = visaFeatures

			const visaGalleries = await knex("visa_galleries").where("visa_galleries.visa_id", id).whereNull("visa_galleries.deleted_at").leftJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id").where("visa_gallery_pivot.language_code", req.language).whereNull("visa_gallery_pivot.deleted_at").select("visa_galleries.*", "visa_gallery_pivot.category")
			visa.visa_galleries = visaGalleries

			// "refund_days" alanı visa_package_pivots tablosunda yok, bu yüzden select'ten çıkarıyoruz.
			const visaPackages = await knex("visa_packages").where("visa_packages.visa_id", id).leftJoin("visa_package_pivots", "visa_packages.id", "visa_package_pivots.visa_package_id").where("visa_package_pivots.language_code", req.language).whereNull("visa_packages.deleted_at").select("visa_packages.*", "visa_package_pivots.name", "visa_package_pivots.description", "visa_package_pivots.refund_policy")
			visa.visa_packages = visaPackages

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_FETCHED_SUCCESS"),
				data: visa,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			// Get the authenticated solution partner from the request
			const solutionPartnerUser = (req as any).user

			const {
				location_id,
				highlight = false,
				refund_days,
				title,
				general_info,
				visa_info,
				refund_policy,
				approval_period,
			} = req.body as {
				location_id: string
				highlight?: boolean
				refund_days?: number
				title: string
				general_info: string
				visa_info: string
				refund_policy: string
				approval_period?: number
			}

			// Validate location_id
			if (location_id) {
				const existingCountry = await new CountryModel().first({
					"countries.id": location_id,
				})

				if (!existingCountry) {
					return res.status(400).send({
						success: false,
						message: req.t("COUNTRY.COUNTRY_NOT_FOUND"),
					})
				}
			}

			const visa = await new VisaModel().create({
				location_id,
				solution_partner_id: solutionPartnerUser?.solution_partner_id,
				status: false,
				highlight,
				refund_days,
				approval_period,
			})

			const translateResult = await translateCreate({
				target: "visa_pivots",
				target_id_key: "visa_id",
				target_id: visa.id,
				language_code: req.language,
				data: {
					title,
					general_info,
					visa_info,
					refund_policy,
				},
			})
			visa.visa_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_CREATED_SUCCESS"),
				data: visa,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { location_id, solution_partner_id, status, highlight, refund_days, title, general_info, visa_info, refund_policy, approval_period } = req.body as {
				location_id?: string
				solution_partner_id?: string
				status?: boolean
				highlight?: boolean
				refund_days?: number
				title?: string
				general_info?: string
				visa_info?: string
				refund_policy?: string
				approval_period?: number
			}

			const existingVisa = await new VisaModel().first({ id })

			if (!existingVisa) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}

			// Validate location_id if provided
			if (location_id) {
				const existingCountry = await new CountryModel().first({
					"countries.id": location_id,
				})

				if (!existingCountry) {
					return res.status(400).send({
						success: false,
						message: req.t("COUNTRY.COUNTRY_NOT_FOUND"),
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
				location_id: location_id !== undefined ? location_id : existingVisa.location_id,
				solution_partner_id: solution_partner_id !== undefined ? solution_partner_id : existingVisa.solution_partner_id,
				status: false,
				highlight: highlight !== undefined ? highlight : existingVisa.highlight,
				refund_days: refund_days !== undefined ? refund_days : existingVisa.refund_days,
				approval_period: approval_period != null ? approval_period : existingVisa.approval_period,
				admin_approval: false,
			}

			await new VisaModel().update(id, body)

			// Update translations if provided
			if (title || general_info || visa_info || refund_policy) {
				await translateUpdate({
					target: "visa_pivots",
					target_id_key: "visa_id",
					target_id: id,
					data: {
						...(title && { title }),
						...(general_info && { general_info }),
						...(visa_info && { visa_info }),
						...(refund_policy && { refund_policy }),
					},
					language_code: req.language,
				})
			}

			const updatedVisa = await new VisaModel().oneToMany(id, "visa_pivots", "visa_id")

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_UPDATED_SUCCESS"),
				data: updatedVisa,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingVisa = await new VisaModel().first({ id })

			if (!existingVisa) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}

			await new VisaModel().delete(id)
			await knex("visa_pivots").where("visa_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_DELETED_ERROR"),
			})
		}
	}
	async sendForApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			// console.log("id", id)
			let visa = await new VisaModel().findId(id)
			// console.log("activity", activity)
			let visaPackages = await new VisaPackageModel().first({
				visa_id: id,
			})
			// console.log("activityPackages", activityPackages)
			let visaGalleries = await new VisaGalleryModel().exists({
				visa_id: id,
			})

			// console.log("activityPackageOpportunities", activityPackageOpportunities)
			// Visa özellikleri kontrolü (services_included_excluded tablosundan)
			let visaFeatures = await new ServiceIncludedExcludedModel().exists({
				service_id: id,
				service_type: "visa",
				type: "normal",
			})

			let visaPackagesImages = await new VisaPackageImageModel().exists({
				visa_package_id: visaPackages?.id,
			})
			// Package özellikleri kontrolü (services_included_excluded tablosundan)
			let visaPackageFeatures = await new ServiceIncludedExcludedModel().exists({
				service_id: visaPackages?.id,
				service_type: "visa",
				type: "package",
			})

			let visaPackagesPrices = await new VisaPackagePriceModel().exists({
				visa_package_id: visaPackages?.id,
			})

			const data = {
				visa,
				visaPackageFeatures,
				visaGalleries,
				visaFeatures,

				visaPackagesImages,
				visaPackages,
				visaPackagesPrices,
			}
			console.log(data)

			if (visa && visaPackageFeatures && visaGalleries && visaFeatures && visaPackagesImages && visaPackages && visaPackagesPrices) {
				// console.log("girdi")
				await new VisaModel().update(id, {
					status: true,
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_SEND_FOR_APPROVAL_SUCCESS"),
				data,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.VISA_SEND_FOR_APPROVAL_ERROR"),
			})
		}
	}
}
