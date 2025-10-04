import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import TourModel from "@/models/TourModel"
import TourPivotModel from "@/models/TourPivotModel"
import TourGalleryModel from "@/models/TourGalleryModel"
import { translateCreate } from "@/helper/translate"
import TourPackageOpportunityModel from "@/models/TourPackageOpportunityModel"
import TourFeatureModel from "@/models/TourFeatureModel"
import TourLocationModel from "@/models/TourLocationModel"
import TourProgramModel from "@/models/TourProgramModel"
import TourPackageImageModel from "@/models/TourPackageImageModel"
import TourDeparturePointModel from "@/models/TourDeparturePointModel"
import TourPackageFeatureModel from "@/models/TourPackageFeatureModel"
import TourPackageModel from "@/models/TourPackageModel"
import TourPackagePriceModel from "@/models/TourPackagePriceModel"
import TourPackagePivotModel from "@/models/TourPackagePivotModel"

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

			const tourFeatures = await knex("tour_features")
				.where("tour_features.tour_id", id)
				.whereNull("tour_features.deleted_at")
				.innerJoin("tour_feature_pivots", "tour_features.id", "tour_feature_pivots.tour_feature_id")
				.where("tour_feature_pivots.language_code", (req as any).language)
				.whereNull("tour_feature_pivots.deleted_at")
				.select("tour_features.*", "tour_feature_pivots.name")
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
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			const tours = await knex("tours")
				.whereNull("tours.deleted_at")
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

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			// Get the authenticated solution partner from the request
			const solutionPartnerUser = (req as any).user
			const { night_count, day_count, refund_days, user_count, title, general_info, tour_info, refund_policy } = req.body as {
				night_count: number
				day_count: number
				refund_days: number
				user_count?: number
				title: string
				general_info: string
				tour_info: string
				refund_policy?: string
			}

			if (!solutionPartnerUser?.solution_partner_id) {
				return res.status(403).send({
					success: false,
					message: req.t("TOUR.TOUR_ACCESS_DENIED"),
					data: null,
				})
			}

			const tour = await new TourModel().create({
				night_count,
				day_count,
				refund_days,
				user_count,
				solution_partner_id: solutionPartnerUser.solution_partner_id,
			})

			const translateResult = await translateCreate({
				target: "tour_pivots",
				target_id_key: "tour_id",
				target_id: tour.id,
				language_code: req.language,
				data: {
					title,
					general_info,
					tour_info,
					refund_policy,
				},
			})
			tour.tour_pivots = translateResult

			return res.status(201).send({
				success: true,
				message: req.t("TOUR.TOUR_CREATED_SUCCESS"),
				data: tour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR.TOUR_CREATED_ERROR"),
				data: null,
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { night_count, day_count, refund_days, user_count, title, general_info, tour_info, refund_policy } = req.body as {
				night_count: number
				day_count: number
				refund_days: number
				user_count?: number
				title: string
				general_info: string
				tour_info: string
				refund_policy?: string
			}

			// Check if anything to update
			if (!night_count && !day_count && !refund_days && !user_count && !title && !general_info && !tour_info && !refund_policy) {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR.NO_UPDATE_DATA"),
				})
			}

			// Check image existence
			const existingTour = await new TourModel().exists({ id })

			if (!existingTour) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR.NOT_FOUND"),
				})
			}

			// Validate hotel if hotel_id is provided
			if (night_count || day_count || refund_days || user_count || title || general_info || tour_info || refund_policy) {
				const tour = await new TourModel().exists({
					id: id,
				})

				if (!tour) {
					return res.status(400).send({
						success: false,
						message: req.t("TOUR.NOT_FOUND"),
					})
				}
			}

			// Prepare update data
			const updateData: any = {}
			if (night_count) updateData.night_count = night_count
			if (day_count) updateData.day_count = day_count
			if (refund_days) updateData.refund_days = refund_days
			if (user_count) updateData.user_count = user_count
			if (title) updateData.title = title
			if (general_info) updateData.general_info = general_info
			if (tour_info) updateData.tour_info = tour_info
			if (refund_policy) updateData.refund_policy = refund_policy
			updateData.admin_approval = false

			// Update image
			const updatedTour = await new TourModel().update(id, updateData)

			// Update translations if provided
			if (title || general_info || tour_info || refund_policy) {
				await knex("tour_pivots").where({ tour_id: id }).update({ deleted_at: new Date() })

				const newTranslations = await translateCreate({
					target: "tour_pivots",
					target_id: id,
					target_id_key: "tour_id",
					data: {
						title,
						general_info,
						tour_info,
						refund_policy,
					},
					language_code: req.language,
				})

				updatedTour.translations = newTranslations
			}

			return res.status(200).send({
				success: true,
				message: req.t("TOUR.UPDATED_SUCCESS"),
				data: updatedTour,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR.UPDATED_ERROR"),
			})
		}
	}
	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			if (!spFromUser) {
				return res.status(403).send({
					success: false,
					message: "Erişim reddedildi",
					data: null,
				})
			}

			// Check if tour exists and user has access
			const existingTour = await new TourModel().first({ id })

			if (!existingTour) {
				return res.status(404).send({
					success: false,
					message: "Tur bulunamadı",
					data: null,
				})
			}

			if (existingTour.solution_partner_id !== spFromUser) {
				return res.status(403).send({
					success: false,
					message: "Erişim reddedildi",
					data: null,
				})
			}

			// Soft delete tour and related pivots
			await new TourModel().delete(id)

			await new TourPivotModel().deleteByTourId(id)

			return res.send({
				success: true,
				message: "Tur başarıyla silindi",
				data: null,
			})
		} catch (error) {
			console.error("Tour delete error:", error)
			return res.status(500).send({
				success: false,
				message: "Sunucu hatası",
				data: null,
			})
		}
	}
	async sendForApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			let tour = await new TourModel().exists({ id })

			let tourGalleries = await new TourGalleryModel().exists({
				tour_id: id,
			})
		
			let tourFeatures = await new TourFeatureModel().exists({
				tour_id: id,
			})
			let tourLocations = await new TourLocationModel().exists({
				tour_id: id,
			})
			let tourPrograms = await new TourProgramModel().exists({
				tour_id: id,
			})
			let tourPackages = await new TourPackageModel().first({
				tour_id: id,
			})
			let tourPackageImages = await new TourPackageImageModel().exists({
				tour_package_id: tourPackages?.id,
			})
			let tourDeparturePoints = await new TourDeparturePointModel().exists({
				tour_id: id,
			})
			let tourPackageFeatures = await new TourPackageFeatureModel().exists({
				tour_package_id: tourPackages?.id,
			})
			let tourPackageOpportunities = await new TourPackageOpportunityModel().exists({
				tour_package_id: tourPackages?.id,
			})
		
			let tourPackagesPrices = await new TourPackagePriceModel().exists({
				tour_package_id: tourPackages?.id,
			})
			let tourPackagesImages = await new TourPackageImageModel().exists({
				tour_package_id: tourPackages?.id,
			})

		

			const data = {
				tour,
				tourPackageOpportunities,
				tourGalleries,
				tourFeatures,
				tourLocations,
				tourPrograms,
				tourPackageImages,
				tourDeparturePoints,
				tourPackageFeatures,
				tourPackages: tourPackages ? true : false,
				tourPackagesPrices,
				tourPackagesImages,
				adminApproval: false,
			}

			if (tour && tourPackageOpportunities && tourGalleries && tourFeatures && tourLocations && tourPrograms && tourPackageImages && tourDeparturePoints && tourPackageFeatures && tourPackages && tourPackagesPrices && tourPackagesImages) {
				await new TourModel().update(id, {
					status: true,
				})
				data.adminApproval = true;
			}


			return res.status(200).send({
				success: true,
				message: req.t("TOUR.TOUR_SEND_FOR_APPROVAL_SUCCESS"),
				data,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR.TOUR_SEND_FOR_APPROVAL_ERROR"),
			})
		}
	}
}
