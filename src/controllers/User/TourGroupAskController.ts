import { FastifyRequest, FastifyReply } from "fastify"

import TourGroupAskModel from "@/models/TourGroupAskModel"

export default class TourGroupAskController {
	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { name, email, phone, user_count, date, tour_id, message } = req.body as {
				name: string
				email: string
				phone: string
				user_count: number
				date: string
				tour_id: string
				message: string
			}

			const tourGroupAsk = await new TourGroupAskModel().create({
				name,
				email,
				phone,
				user_count,
				date,
				tour_id,
				message,
				user_id: req.user?.id,
			})

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_CREATED_SUCCESS"),
				data: tourGroupAsk,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_GROUP_ASK.TOUR_GROUP_ASK_CREATED_ERROR"),
			})
		}
	}
}
