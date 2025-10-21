import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import CityModel from "@/models/CityModel"
import VisaModel from "@/models/VisaModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import SolutionPartnerModel from "@/models/SolutionPartnerModel"
import VisaPivotModel from "@/models/VisaPivotModel"
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
							// city_pivots.name kaldırıldı
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
					"visa_pivots.title as title",
					"visa_pivots.general_info",
					"visa_pivots.visa_info",
					"visa_pivots.refund_policy",
					knex.ref("country_pivots.name").as("country_name"),
					// city_name kaldırıldı
					knex.ref("countries.id").as("location_id")
				)
				.orderBy("visas.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}`.trim(), // city_name kaldırıldı
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
			const { status, admin_approval } = req.query as {
				status?: boolean
				admin_approval?: boolean
			}
			const visas = await knex("visas")
				.whereNull("visas.deleted_at")
				.modify(qb => {
					if (typeof status !== "undefined") qb.where("visas.status", status)
					if (typeof admin_approval !== "undefined") qb.where("visas.admin_approval", admin_approval)
				})
				.innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
				.innerJoin("countries", "visas.location_id", "countries.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("country_pivots", "countries.id", "country_pivots.country_id")
				.where("visa_pivots.language_code", req.language)
				.where("country_pivots.language_code", req.language)
				.whereNull("countries.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("visa_pivots.deleted_at")
				.whereNull("visas.deleted_at")
				.select("visas.*", "visa_pivots.title as title", "visa_pivots.general_info", "visa_pivots.visa_info", "visa_pivots.refund_policy", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"))
			const newData = visas.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
				}
			})
			return res.status(200).send({
				success: true,
				message: req.t("VISA.VISA_FETCHED_SUCCESS"),
				data: newData,
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
				const city = await knex("cities")
					.where("cities.id", visa.location_id)
					.whereNull("cities.deleted_at")
					.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
					.where("country_pivots.language_code", req.language)
					.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
					.where("city_pivots.language_code", req.language)
					.whereNull("cities.deleted_at")
					.whereNull("country_pivots.deleted_at")
					.whereNull("city_pivots.deleted_at")
					.select("country_pivots.name as country_name", "city_pivots.name as city_name", "cities.country_id as country_id")
					.first()
				visa.location = city
				visa.address = `${city.country_name}, ${city.city_name}`
				visa.country_id = city.country_id
			}

			const visaFeatures = await knex("visa_features").where("visa_features.visa_id", id).whereNull("visa_features.deleted_at").innerJoin("visa_feature_pivots", "visa_features.id", "visa_feature_pivots.visa_feature_id").where("visa_feature_pivots.language_code", req.language).select("visa_features.*", "visa_feature_pivots.name")
			visa.visa_features = visaFeatures

			const visaGalleries = await knex("visa_galleries").where("visa_galleries.visa_id", id).whereNull("visa_galleries.deleted_at").leftJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id").where("visa_gallery_pivot.language_code", req.language).whereNull("visa_gallery_pivot.deleted_at").select("visa_galleries.*", "visa_gallery_pivot.category")
			visa.visa_galleries = visaGalleries

			// "refund_days" alanı visa_package_pivots tablosunda yok, bu yüzden select'ten çıkarıyoruz.
			const visaPackages = await knex("visa_packages").where("visa_packages.visa_id", id).leftJoin("visa_package_pivots", "visa_packages.id", "visa_package_pivots.visa_package_id").where("visa_package_pivots.language_code", req.language).whereNull("visa_packages.deleted_at").select("visa_packages.*", "visa_package_pivots.name", "visa_package_pivots.description", "visa_package_pivots.refund_policy")
			for (const pkg of visaPackages) {
				// Fiyat bilgilerini al
				const prices = await knex("visa_package_prices").where("visa_package_prices.visa_package_id", pkg.id).whereNull("visa_package_prices.deleted_at").leftJoin("currencies", "visa_package_prices.currency_id", "currencies.id").select("visa_package_prices.*", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
				pkg.prices = prices
			}
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

	async updateVisaApproval(req: FastifyRequest, res: FastifyReply) {
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
					message: req.t("VISA.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingVisa = await new VisaModel().first({ id })

			if (!existingVisa) {
				return res.status(404).send({
					success: false,
					message: req.t("VISA.VISA_NOT_FOUND"),
				})
			}

			await new VisaModel().update(id, {
				admin_approval: admin_approval,
				status: status,
			})

			const updatedVisa = await new VisaModel().oneToMany(id, "visa_pivots", "visa_id")
			// console.log(updatedVisa)

			return res.status(200).send({
				success: true,
				message: req.t("VISA.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedVisa,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
}
