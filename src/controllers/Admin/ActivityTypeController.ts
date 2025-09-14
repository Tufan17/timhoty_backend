import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import { translateCreate, translateUpdate } from "@/helper/translate"

export default class ActivityTypeController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const language = req.language

			const query = knex("activity_types")
				.whereNull("activity_types.deleted_at")
				.innerJoin("activities_type_pivots", "activity_types.id", "activities_type_pivots.activity_type_id")
				.where("activities_type_pivots.language_code", language)
				.where(function () {
					this.where("activities_type_pivots.name", "ilike", `%${search}%`)
					if (search.toLowerCase() === "true" || search.toLowerCase() === "false") {
						this.orWhere("activity_types.status", search.toLowerCase() === "true")
					}
				})
				.select("activity_types.*", "activities_type_pivots.name as name")
				.groupBy("activity_types.id", "activities_type_pivots.name")

			const countResult = await query.clone().count("* as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("activity_types.created_at", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_SUCCESS"),
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
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const activityType = await knex("activity_types").where("activity_types.id", id).whereNull("activity_types.deleted_at").leftJoin("activities_type_pivots", "activity_types.id", "activities_type_pivots.activity_type_id").where("activities_type_pivots.language_code", req.language).select("activity_types.*", "activities_type_pivots.name as name").groupBy("activity_types.id", "activities_type_pivots.name").first()

			if (!activityType) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_NOT_FOUND"),
				})
			}
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_SUCCESS"),
				data: activityType,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { name, status } = req.body as {
				name: string
				status?: boolean
			}

			const activityType = await new ActivityTypeModel().create({
				status: status || true,
			})

			const translateResult = await translateCreate({
				target: "activities_type_pivots",
				target_id_key: "activity_type_id",
				target_id: activityType.id,
				data: {
					name,
				},
				language_code: req.language,
			})
			activityType.activities_type_pivots = translateResult

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_CREATED_SUCCESS"),
				data: activityType,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { name, status } = req.body as {
				name: string
				status?: boolean
			}

			const existingActivityType = await new ActivityTypeModel().first({ id })

			if (!existingActivityType) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_NOT_FOUND"),
				})
			}

			let body: any = {
				status,
			}

			await new ActivityTypeModel().update(id, body)
			await translateUpdate({
				target: "activities_type_pivots",
				target_id_key: "activity_type_id",
				target_id: id,
				data: {
					name,
				},
				language_code: req.language,
			})
			const updatedActivityType = await new ActivityTypeModel().oneToMany(id, "activities_type_pivots", "activity_type_id")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_UPDATED_SUCCESS"),
				data: updatedActivityType,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingActivityType = await new ActivityTypeModel().first({ id })

			if (!existingActivityType) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_NOT_FOUND"),
				})
			}

			await new ActivityTypeModel().delete(id)
			await knex("activities_type_pivots").where("activity_type_id", id).whereNull("deleted_at").update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_DELETED_ERROR"),
			})
		}
	}
}
