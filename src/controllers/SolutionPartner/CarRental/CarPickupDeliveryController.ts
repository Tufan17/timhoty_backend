import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import CarPickupDeliveryModel from "@/models/CarPickupDeliveryModel"
import CarRentalModel from "@/models/CarRentalModel"
import StationModel from "@/models/StationModel"

export default class CarPickupDeliveryController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				car_rental_id,
				station_id,
				status,
			} = req.query as {
				page: number
				limit: number
				search: string
				car_rental_id?: string
				station_id?: string
				status?: boolean
			}

			const language = (req as any).language
			const solutionPartnerUser = (req as any).user
			const spFromUser = solutionPartnerUser?.solution_partner_id

			// Base query with JOINs
			const base = knex("car_pickup_delivery")
				.whereNull("car_pickup_delivery.deleted_at")
				.innerJoin("car_rentals", "car_pickup_delivery.car_rental_id", "car_rentals.id")
				.innerJoin("stations", "car_pickup_delivery.station_id", "stations.id")
				.innerJoin("cities", "stations.location_id", "cities.id")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.innerJoin("country_pivots", "cities.country_id", "country_pivots.country_id")
				.where("city_pivots.language_code", language)
				.where("country_pivots.language_code", language)
				.modify(qb => {
					// Filter by solution partner
					if (spFromUser) {
						qb.where("car_rentals.solution_partner_id", spFromUser)
					}

					if (typeof status !== "undefined") {
						qb.where("car_pickup_delivery.status", status)
					}
					if (car_rental_id) {
						qb.where("car_pickup_delivery.car_rental_id", car_rental_id)
					}
					if (station_id) {
						qb.where("car_pickup_delivery.station_id", station_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("city_pivots.name", "ilike", like).orWhere("country_pivots.name", "ilike", like)
						})

						// "true"/"false" metni status filtresine eşlensin
						const sv = search.toLowerCase()
						if (sv === "true" || sv === "false") {
							qb.orWhere("car_pickup_delivery.status", sv === "true")
						}
					}
				})

			// Total count
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("car_pickup_delivery.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Data selection
			const data = await base
				.clone()
				.distinct("car_pickup_delivery.id")
				.select("car_pickup_delivery.*", "car_rentals.title as car_rental_title", "city_pivots.name as city_name", "country_pivots.name as country_name")
				.orderBy("car_pickup_delivery.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			const newData = data.map((item: any) => {
				return {
					...item,
					address: `${item.city_name || ""}, ${item.country_name || ""}`.trim(),
				}
			})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_SUCCESS"),
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
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { search } = req.query as { search: string }
			const language = (req as any).language
			const solutionPartnerUser = (req as any).user

			const pickupDeliveries = await knex("car_pickup_delivery")
				.whereNull("car_pickup_delivery.deleted_at")
				.innerJoin("car_rentals", "car_pickup_delivery.car_rental_id", "car_rentals.id")
				.where("car_rentals.solution_partner_id", solutionPartnerUser.solution_partner_id)
				.modify(qb => {
					if (search) {
						const like = `%${search}%`
						qb.where("car_rentals.title", "ilike", like)
					}
				})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_SUCCESS"),
				data: pickupDeliveries,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language
			const solutionPartnerUser = (req as any).user

			const pickupDelivery = await knex("car_pickup_delivery").whereNull("car_pickup_delivery.deleted_at").where("car_pickup_delivery.car_rental_id", id).innerJoin("station_pivots", "car_pickup_delivery.station_id", "station_pivots.station_id").where("station_pivots.language_code", language).select("car_pickup_delivery.*", "station_pivots.name as name").groupBy("car_pickup_delivery.id", "station_pivots.name")

			if (!pickupDelivery) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_SUCCESS"),
				data: pickupDelivery,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const solutionPartnerUser = (req as any).user
			const {
				car_rental_id,
				station_id,
				status = false,
			} = req.body as {
				car_rental_id: string
				station_id: string
				status?: boolean
			}

			// Validate car_rental_id
			const existingCarRental = await new CarRentalModel().first({
				id: car_rental_id,
				solution_partner_id: solutionPartnerUser.solution_partner_id,
			})

			if (!existingCarRental) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
				})
			}

			// Validate station_id
			const existingStation = await new StationModel().first({
				id: station_id,
			})

			if (!existingStation) {
				return res.status(400).send({
					success: false,
					message: req.t("STATION.STATION_NOT_FOUND"),
				})
			}

			const pickupDelivery = await new CarPickupDeliveryModel().create({
				car_rental_id,
				station_id,
				status,
			})
			await new CarRentalModel().update(car_rental_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_CREATED_SUCCESS"),
				data: pickupDelivery,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { car_rental_id, station_id, status } = req.body as {
				car_rental_id?: string
				station_id?: string
				status?: boolean
			}

			const solutionPartnerUser = (req as any).user

			const existingPickupDelivery = await new CarPickupDeliveryModel().first({ id })

			if (!existingPickupDelivery) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_NOT_FOUND"),
				})
			}

			// Verify ownership through car_rental
			const carRental = await new CarRentalModel().first({
				id: existingPickupDelivery.car_rental_id,
				solution_partner_id: solutionPartnerUser.solution_partner_id,
			})

			if (!carRental) {
				return res.status(403).send({
					success: false,
					message: req.t("CAR_PICKUP_DELIVERY.ACCESS_DENIED"),
				})
			}

			// Validate car_rental_id if provided
			if (car_rental_id) {
				const newCarRental = await new CarRentalModel().first({
					id: car_rental_id,
					solution_partner_id: solutionPartnerUser.solution_partner_id,
				})

				if (!newCarRental) {
					return res.status(400).send({
						success: false,
						message: req.t("CAR_RENTAL.CAR_RENTAL_NOT_FOUND"),
					})
				}
			}

			// Validate station_id if provided
			if (station_id) {
				const newStation = await new StationModel().first({
					id: station_id,
					solution_partner_id: solutionPartnerUser.solution_partner_id,
				})

				if (!newStation) {
					return res.status(400).send({
						success: false,
						message: req.t("STATION.STATION_NOT_FOUND"),
					})
				}
			}

			let body: any = {
				car_rental_id: car_rental_id !== undefined ? car_rental_id : existingPickupDelivery.car_rental_id,
				station_id: station_id !== undefined ? station_id : existingPickupDelivery.station_id,
				status: status !== undefined ? status : existingPickupDelivery.status,
			}

			await new CarPickupDeliveryModel().update(id, body)

			const updatedPickupDelivery = await new CarPickupDeliveryModel().findId(id)
			await new CarRentalModel().update(existingPickupDelivery.car_rental_id, {
				status: false,
				admin_approval: false,
			})
			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_UPDATED_SUCCESS"),
				data: updatedPickupDelivery,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const solutionPartnerUser = (req as any).user

			const existingPickupDelivery = await new CarPickupDeliveryModel().first({ id })

			if (!existingPickupDelivery) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_NOT_FOUND"),
				})
			}

			// Verify ownership through car_rental
			const carRental = await new CarRentalModel().first({
				id: existingPickupDelivery.car_rental_id,
				solution_partner_id: solutionPartnerUser.solution_partner_id,
			})

			if (!carRental) {
				return res.status(403).send({
					success: false,
					message: req.t("CAR_PICKUP_DELIVERY.ACCESS_DENIED"),
				})
			}

			await new CarPickupDeliveryModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_PICKUP_DELIVERY.CAR_PICKUP_DELIVERY_DELETED_ERROR"),
			})
		}
	}
}
