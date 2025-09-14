import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"

export default class ActivityTypeController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { search = "" } = req.query as { search: string }

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
				.orderBy("activity_types.created_at", "asc")

			const data = await query

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_SUCCESS"),
				data: data,
				total: data.length,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_TYPE.ACTIVITY_TYPE_FETCHED_ERROR"),
			})
		}
	}
}
