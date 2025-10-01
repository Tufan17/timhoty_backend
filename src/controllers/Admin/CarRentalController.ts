import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
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
			const { status, admin_approval } = req.query as {
				status?: boolean
				admin_approval?: boolean
			}
			const carRentals = await knex("car_rentals")
				.whereNull("car_rentals.deleted_at")
				.modify(qb => {
					if (typeof status !== "undefined") qb.where("car_rentals.status", status)
					if (typeof admin_approval !== "undefined") qb.where("car_rentals.admin_approval", admin_approval)
				})
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
			for (const pkg of carRentalPackages) {
				const prices = await knex("car_rental_package_prices").where("car_rental_package_prices.car_rental_package_id", pkg.id).whereNull("car_rental_package_prices.deleted_at").leftJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id").select("car_rental_package_prices.*", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
				pkg.prices = prices
			}
			// console.log(carRentalPackages)

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

	async updateCarRentalApproval(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { admin_approval, status } = req.body as {
				admin_approval: boolean
				status: boolean
			}

			if (typeof admin_approval === "undefined") {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL.ADMIN_APPROVAL_REQUIRED"),
				})
			}

			const existingCarRental = await new CarRentalModel().first({ id })

			if (!existingCarRental) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL.NOT_FOUND"),
				})
			}

			await new CarRentalModel().update(id, {
				admin_approval: admin_approval,
				status: status,
			})

			const updatedActivity = await new CarRentalModel().oneToMany(id, "car_rental_pivots", "car_rental_id")
			console.log(updatedActivity)

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL.ADMIN_APPROVAL_UPDATED_SUCCESS"),
				data: updatedActivity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL.ADMIN_APPROVAL_UPDATED_ERROR"),
			})
		}
	}
}
