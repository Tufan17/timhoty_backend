import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import UserGuideModel from "@/models/UserGuideModel"
import { translateCreate, translateUpdate } from "@/helper/translate"

export default class UserGuideController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { page = 1, limit = 10, search = "" } = req.query as { page: number; limit: number; search: string }

			const language = req.language

			const query = knex("user_guides")
				.whereNull("user_guides.deleted_at")
				.innerJoin("user_guide_pivots", "user_guides.id", "user_guide_pivots.user_guide_id")
				.where("user_guide_pivots.language_code", language)
				.where(function () {
					this.where("user_guide_pivots.title", "ilike", `%${search}%`)
				})
				.select("user_guides.*", "user_guide_pivots.title as title", "user_guide_pivots.description as description")
				.groupBy("user_guides.id", "user_guide_pivots.title", "user_guide_pivots.description")

			const countResult = await query.clone().count("* as total").first()
			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))
			const data = await query
				.clone()
				.orderBy("user_guides.order", "asc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_SUCCESS"),
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
				message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_ERROR"),
			})
		}
	}
}
