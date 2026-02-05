import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import CityModel from "@/models/CityModel"
import { translateCreate, translateUpdate } from "@/helper/translate"

export default class CityController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				country_id = "",
			} = req.query as {
				page: number
				limit: number
				search: string
				country_id: string
			}

			const language = req.language || "en"

			const query = knex("cities")
				.whereNull("cities.deleted_at")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("city_pivots.language_code", language)
				.where(function () {
					if (country_id) {
						this.where("cities.country_id", country_id)
					}
				})
				.where(function () {
					this.where("city_pivots.name", "ilike", `%${search}%`)
				})
				.select("cities.*", "city_pivots.name as name")
				.groupBy("cities.id", "city_pivots.name")

			// Toplam sayım (clearSelect + clearOrder + clearGroup + countDistinct)
			const countResult = await query.clone().clearSelect().clearOrder().clearGroup().countDistinct("cities.id as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("cities.created_at", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_FETCHED_SUCCESS"),
				data: data,
				recordsPerPageOptions: [10, 20, 50, 100],
				total: total,
				totalPages: totalPages,
				currentPage: Number(page),
				limit: Number(limit),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { country_id = "" } = req.query as { country_id: string }
			const language = req.language || "en"
			const cities = await knex("cities")
				.whereNull("cities.deleted_at")
				.innerJoin("city_pivots", "cities.id", "city_pivots.city_id")
				.where("city_pivots.language_code", language)
				.where(function () {
					if (country_id) {
						this.where("cities.country_id", country_id)
					}
				})
				.select("cities.id as id", "city_pivots.name as name")
			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_FETCHED_SUCCESS"),
				data: cities,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }

			const language = req.language

			const city = await knex("cities").where("cities.id", id).whereNull("cities.deleted_at").innerJoin("city_pivots", "cities.id", "city_pivots.city_id").where("city_pivots.language_code", language).select("cities.*", "city_pivots.name as name").first()

			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_FETCHED_SUCCESS"),
				data: city,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				name,
				country_id,
				number_plate = "",
				photo = "",
			} = req.body as {
				name: string
				country_id: string
				number_plate?: string
				photo?: string
			}
			const language = req.language || "en"
			const existingCity = await knex("cities").where("country_id", country_id).where("number_plate", number_plate).innerJoin("city_pivots", "cities.id", "city_pivots.city_id").where("city_pivots.language_code", language).where("city_pivots.name", name).whereNull("cities.deleted_at").whereNull("city_pivots.deleted_at").first()

			if (existingCity) {
				return res.status(400).send({
					success: false,
					message: req.t("CITY.CITY_ALREADY_EXISTS"),
				})
			}
			const city = await new CityModel().create({
				country_id,
				number_plate,
				photo,
			})
			const translateResult = await translateCreate({
				target: "city_pivots",
				target_id_key: "city_id",
				target_id: city.id,
				data: {
					name,
				},
				language_code: req.language,
			})
			city.city_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_CREATED_SUCCESS"),
				data: city,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { name, country_id, number_plate, photo } = req.body as {
				name: string
				country_id: string
				number_plate: string
				photo?: string
			}

			const existingCity = await new CityModel().first({ id })

			if (!existingCity) {
				return res.status(404).send({
					success: false,
					message: req.t("CITY.CITY_NOT_FOUND"),
				})
			}

			let body: any = {
				country_id,
				number_plate,
				photo,
			}

			const updatedCityData = await new CityModel().update(id, body)
			await translateUpdate({
				target: "city_pivots",
				target_id_key: "city_id",
				target_id: id,
				data: {
					name,
				},
				language_code: req.language,
			})
			const updatedCityPivots = await new CityModel().oneToMany(id, "city_pivots", "city_id")

			const updatedCity = {
				...updatedCityData[0],
				city_pivots: updatedCityPivots,
			}

			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_UPDATED_SUCCESS"),
				data: updatedCity,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingCity = await new CityModel().first({ id })

			if (!existingCity) {
				return res.status(404).send({
					success: false,
					message: req.t("CITY.CITY_NOT_FOUND"),
				})
			}

			await new CityModel().delete(id)
			await knex("city_pivots").where("city_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("CITY.CITY_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CITY.CITY_DELETED_ERROR"),
			})
		}
	}
}
