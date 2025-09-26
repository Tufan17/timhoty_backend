import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import CityModel from "@/models/CityModel"
import CarRentalModel from "@/models/CarRentalModel"
import CarRentalPivotModel from "@/models/CarRentalPivotModel"
import { translateCreate, translateUpdate } from "@/helper/translate"
import SolutionPartnerModel from "@/models/SolutionPartnerModel"

export default class CarRentalController {
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
			const base = knex("car_rentals")
				.whereNull("car_rentals.deleted_at")
				.innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
				.innerJoin("cities", "car_rentals.location_id", "cities.id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.innerJoin("car_type_pivots", "car_rentals.car_type_id", "car_type_pivots.car_type_id")
				.innerJoin("gear_type_pivots", "car_rentals.gear_type_id", "gear_type_pivots.gear_type_id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("car_rental_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.where("city_pivots.language_code", language)
				.where("car_type_pivots.language_code", language)
				.where("gear_type_pivots.language_code", language)
				.whereNull("cities.deleted_at")
				.whereNull("country_pivots.deleted_at")
				.whereNull("city_pivots.deleted_at")
				.whereNull("car_rental_pivots.deleted_at")
				.modify(qb => {
					// solution_partner_id (önce user'dan, yoksa query)
					if (spFromUser) qb.where("car_rentals.solution_partner_id", spFromUser)
					else if (solution_partner_id) qb.where("car_rentals.solution_partner_id", solution_partner_id)

					if (typeof status !== "undefined") qb.where("car_rentals.status", status)
					if (typeof admin_approval !== "undefined") qb.where("car_rentals.admin_approval", admin_approval)
					if (typeof highlight !== "undefined") qb.where("car_rentals.highlight", highlight)
					if (location_id) qb.where("car_rentals.location_id", location_id)

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("car_rental_pivots.title", "ilike", like).orWhere("car_rental_pivots.general_info", "ilike", like).orWhere("car_rental_pivots.car_info", "ilike", like).orWhere("country_pivots.name", "ilike", like).orWhere("city_pivots.name", "ilike", like).orWhere("car_type_pivots.name", "ilike", like).orWhere("gear_type_pivots.name", "ilike", like)
						})

						// "true"/"false" metni status filtresine eşlensin (opsiyonel)
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("car_rentals.status", sv === "true")
						}
					}
				})

			// Toplam sayım (benzersiz araç kiralama)
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("car_rentals.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Veri seçimi
			const data = await base
				.clone()
				.distinct("car_rentals.id") // aynı araç kiralama birden fazla pivot kaydına düşmesin
				.select("car_rentals.*", "car_rental_pivots.title as title", "car_rental_pivots.general_info", "car_rental_pivots.car_info", "car_rental_pivots.refund_policy", knex.ref("country_pivots.name").as("country_name"), knex.ref("city_pivots.name").as("city_name"), knex.ref("car_type_pivots.name").as("car_type_name"), knex.ref("gear_type_pivots.name").as("gear_type_name"))
				.orderBy("car_rentals.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.country_name || ""}, ${item.city_name || ""}`.trim(),
					car_type_id: item.car_type_id,
					gear_type_id: item.gear_type_id,
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_SUCCESS"),
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
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const carRentals = await knex("car_rentals").whereNull("car_rentals.deleted_at")
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_SUCCESS"),
				data: carRentals,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const carRental = await knex("car_rentals")
				.whereNull("car_rentals.deleted_at")
				.where("car_rentals.id", id)
				.select("car_rentals.*", "car_rental_pivots.title as title", "car_rental_pivots.general_info", "car_rental_pivots.car_info", "car_rental_pivots.refund_policy")
				.innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
				.innerJoin("car_type_pivots", "car_rentals.car_type_id", "car_type_pivots.car_type_id")
				.where("car_rental_pivots.language_code", req.language)
				.first()

			if (!carRental) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
				})
			}

			if (carRental.location_id) {
				const city = await knex("cities")
					.where("cities.id", carRental.location_id)
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
				carRental.location = city
				carRental.address = `${city.country_name}, ${city.city_name}`
				carRental.country_id = city.country_id
			}

			// Get car type and gear type information
			if (carRental.car_type_id) {
				const carType = await knex("car_type_pivots").where("car_type_pivots.car_type_id", carRental.car_type_id).where("car_type_pivots.language_code", req.language).whereNull("car_type_pivots.deleted_at").select("car_type_pivots.name").first()
				carRental.car_type_name = carType?.name
			}

			if (carRental.gear_type_id) {
				const gearType = await knex("gear_type_pivots").where("gear_type_pivots.gear_type_id", carRental.gear_type_id).where("gear_type_pivots.language_code", req.language).whereNull("gear_type_pivots.deleted_at").select("gear_type_pivots.name").first()
				carRental.gear_type_name = gearType?.name
			}

			const carRentalGalleries = await knex("car_rental_galleries").where("car_rental_galleries.car_rental_id", id).innerJoin("car_rental_gallery_pivots", "car_rental_galleries.id", "car_rental_gallery_pivots.car_rental_gallery_id").where("car_rental_gallery_pivots.language_code", req.language).whereNull("car_rental_galleries.deleted_at").select("car_rental_galleries.*", "car_rental_gallery_pivots.category")

			carRental.car_rental_galleries = carRentalGalleries

			const carRentalFeatures = await knex("car_rental_features").where("car_rental_features.car_rental_id", id).innerJoin("car_rental_feature_pivots", "car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id").where("car_rental_feature_pivots.language_code", req.language).whereNull("car_rental_features.deleted_at").select("car_rental_features.*", "car_rental_feature_pivots.name")

			carRental.car_rental_features = carRentalFeatures

			const carRentalPickupDelivery = await knex("car_pickup_delivery").where("car_pickup_delivery.car_rental_id", id).whereNull("car_pickup_delivery.deleted_at").innerJoin("station_pivots", "car_pickup_delivery.station_id", "station_pivots.station_id").where("station_pivots.language_code", req.language).select("car_pickup_delivery.*", "station_pivots.name as name")

			carRental.car_pickup_delivery = carRentalPickupDelivery

			const carRentalPackages = await knex("car_rental_packages")
				.where("car_rental_packages.car_rental_id", id)
				.whereNull("car_rental_packages.deleted_at")
				.innerJoin("car_rental_package_pivots", "car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
				.where("car_rental_package_pivots.language_code", req.language)
				.select("car_rental_packages.*", "car_rental_package_pivots.name", "car_rental_package_pivots.description", "car_rental_package_pivots.refund_policy")

			carRental.car_rental_packages = carRentalPackages

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_SUCCESS"),
				data: carRental,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.CAR_RENTAL_FETCHED_ERROR"),
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
				admin_approval = false,
				car_type_id,
				gear_type_id,
				user_count = 0,
				door_count = 0,
				age_limit = 0,
				air_conditioning = false,
				about_to_run_out = false,
				title,
				general_info,
				car_info,
				refund_policy,
			} = req.body as {
				location_id: string
				highlight?: boolean
				admin_approval?: boolean
				car_type_id?: string
				gear_type_id?: string
				user_count?: number
				door_count?: number
				age_limit?: number
				air_conditioning?: boolean
				about_to_run_out?: boolean
				title: string
				general_info: string
				car_info: string
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

			const carRental = await new CarRentalModel().create({
				location_id,
				solution_partner_id: solutionPartnerUser?.solution_partner_id,
				status: false,
				highlight,
				admin_approval,
				car_type_id,
				gear_type_id,
				user_count,
				door_count,
				age_limit,
				air_conditioning,
				about_to_run_out,
				comment_count: 0,
				average_rating: 0,
			})

			const translateResult = await translateCreate({
				target: "car_rental_pivots",
				target_id_key: "car_rental_id",
				target_id: carRental.id,
				language_code: req.language,
				data: {
					title,
					general_info,
					car_info,
					refund_policy,
				},
			})
			carRental.car_rental_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_CREATED_SUCCESS"),
				data: carRental,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.CAR_RENTAL_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { location_id, solution_partner_id, status, highlight, admin_approval, car_type_id, gear_type_id, user_count, door_count, age_limit, air_conditioning, about_to_run_out, title, general_info, car_info, refund_policy } = req.body as {
				location_id?: string
				solution_partner_id?: string
				status?: boolean
				highlight?: boolean
				admin_approval?: boolean
				car_type_id?: string
				gear_type_id?: string
				user_count?: number
				door_count?: number
				age_limit?: number
				air_conditioning?: boolean
				about_to_run_out?: boolean
				title?: string
				general_info?: string
				car_info?: string
				refund_policy?: string
			}

			const existingCarRental = await new CarRentalModel().first({ id })

			if (!existingCarRental) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
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
				location_id: location_id !== undefined ? location_id : existingCarRental.location_id,
				solution_partner_id: solution_partner_id !== undefined ? solution_partner_id : existingCarRental.solution_partner_id,
				status: status !== undefined ? status : existingCarRental.status,
				highlight: highlight !== undefined ? highlight : existingCarRental.highlight,
				admin_approval: admin_approval !== undefined ? admin_approval : existingCarRental.admin_approval,
				car_type_id: car_type_id !== undefined ? car_type_id : existingCarRental.car_type_id,
				gear_type_id: gear_type_id !== undefined ? gear_type_id : existingCarRental.gear_type_id,
				user_count: user_count !== undefined ? user_count : existingCarRental.user_count,
				door_count: door_count !== undefined ? door_count : existingCarRental.door_count,
				age_limit: age_limit !== undefined ? age_limit : existingCarRental.age_limit,
				air_conditioning: air_conditioning !== undefined ? air_conditioning : existingCarRental.air_conditioning,
				about_to_run_out: about_to_run_out !== undefined ? about_to_run_out : existingCarRental.about_to_run_out,
			}

			await new CarRentalModel().update(id, body)

			// Update translations if provided
			if (title || general_info || car_info || refund_policy) {
				await translateUpdate({
					target: "car_rental_pivots",
					target_id_key: "car_rental_id",
					target_id: id,
					data: {
						...(title && { title }),
						...(general_info && { general_info }),
						...(car_info && { car_info }),
						...(refund_policy && { refund_policy }),
					},
					language_code: req.language,
				})
			}

			const updatedCarRental = await new CarRentalModel().oneToMany(id, "car_rental_pivots", "car_rental_id")

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_UPDATED_SUCCESS"),
				data: updatedCarRental,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.CAR_RENTAL_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingCarRental = await new CarRentalModel().first({ id })

			if (!existingCarRental) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
				})
			}

			await new CarRentalModel().delete(id)
			await knex("car_rental_pivots").where("car_rental_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.CAR_RENTAL_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.CAR_RENTAL_DELETED_ERROR"),
			})
		}
	}
}
