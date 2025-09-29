import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../db/knex"
import UserGuideModel from "@/models/UserGuideModel"
import { translateCreate, translateUpdate } from "@/helper/translate"

export default class UserGuideController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { search = "" } = req.query as { search: string }
			const language = req.language

			const data = await knex("user_guides")
				.whereNull("user_guides.deleted_at")
				.innerJoin("user_guide_pivots", "user_guides.id", "user_guide_pivots.user_guide_id")
				.where("user_guide_pivots.language_code", language)
				.where(function () {
					this.where("user_guide_pivots.title", "ilike", `%${search}%`)
				})
				.select("user_guides.*", "user_guide_pivots.title as title", "user_guide_pivots.description as description")
				.groupBy("user_guides.id", "user_guide_pivots.title", "user_guide_pivots.description")
				.orderBy("user_guides.order", "asc")

			return res.status(200).send({
				success: true,
				message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_SUCCESS"),
				data: data,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_ERROR"),
			})
		}
	}
	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			// const userGuide = await new UserGuideModel().oneToMany(id, "user_guide_pivots", "user_guide_id");
			const userGuide = await knex("user_guides")
				.where("user_guides.id", id)
				.whereNull("user_guides.deleted_at")
				.innerJoin("user_guide_pivots", "user_guides.id", "user_guide_pivots.user_guide_id")
				.where("user_guide_pivots.language_code", req.language)
				.select("user_guides.*", "user_guide_pivots.title as title", "user_guide_pivots.description as description")
				.groupBy("user_guides.id", "user_guide_pivots.title", "user_guide_pivots.description")
				.first()

			return res.status(200).send({
				success: true,
				message: req.t("USER_GUIDE.USER_GUIDE_FETCHED_SUCCESS"),
				data: userGuide,
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
