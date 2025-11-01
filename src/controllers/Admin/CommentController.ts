import { FastifyReply, FastifyRequest } from "fastify"
import knex from "@/db/knex"
import CommentModel from "@/models/CommentModel"
import HotelModel from "@/models/HotelModel"
import CarRentalModel from "@/models/CarRentalModel"
import ActivityModel from "@/models/ActivityModel"
import TourModel from "@/models/TourModel"
import VisaModel from "@/models/VisaModel"

const NEGATIVE_RATING_THRESHOLD = 2.5

export default class CommentController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				service_type,
				rating_min,
				rating_max,
				only_negative,
			} = req.query as {
				page?: number | string
				limit?: number | string
				search?: string
				service_type?: string
				rating_min?: number | string
				rating_max?: number | string
				only_negative?: boolean | string
			}

			const pageNumber = Number(page) || 1
			const limitNumber = Number(limit) || 10
			const ratingMinValue = rating_min !== undefined ? Number(rating_min) : undefined
			const ratingMaxValue = rating_max !== undefined ? Number(rating_max) : undefined
			const negativeOnly =
				typeof only_negative === "string"
					? ["1", "true", "yes"].includes(only_negative.toLowerCase())
					: Boolean(only_negative)

			const base = knex("comments")
				.whereNull("comments.deleted_at")
				.leftJoin("users", "comments.user_id", "users.id")
				.modify(qb => {
					if (service_type) {
						qb.where("comments.service_type", service_type)
					}
					if (ratingMinValue !== undefined) {
						qb.where("comments.rating", ">=", ratingMinValue)
					}
					if (ratingMaxValue !== undefined) {
						qb.where("comments.rating", "<=", ratingMaxValue)
					}
					if (negativeOnly) {
						qb.where("comments.rating", "<=", NEGATIVE_RATING_THRESHOLD)
					}
					if (search) {
						const like = `%${search}%`
						qb.andWhere(inner => {
							inner
								.where("comments.comment", "ilike", like)
								.orWhere("users.name_surname", "ilike", like)
								.orWhere("users.email", "ilike", like)
								.orWhereRaw(
									`EXISTS (SELECT 1 FROM hotel_pivots hp WHERE hp.hotel_id = comments.service_id AND comments.service_type = 'hotel' AND hp.deleted_at IS NULL AND hp.language_code = comments.language_code AND hp.name ILIKE ?)`,
									[like],
								)
								.orWhereRaw(
									`EXISTS (SELECT 1 FROM car_rental_pivots crp WHERE crp.car_rental_id = comments.service_id AND comments.service_type = 'car_rental' AND crp.deleted_at IS NULL AND crp.language_code = comments.language_code AND crp.title ILIKE ?)`,
									[like],
								)
								.orWhereRaw(
									`EXISTS (SELECT 1 FROM activity_pivots ap WHERE ap.activity_id = comments.service_id AND comments.service_type = 'activity' AND ap.deleted_at IS NULL AND ap.language_code = comments.language_code AND ap.title ILIKE ?)`,
									[like],
								)
								.orWhereRaw(
									`EXISTS (SELECT 1 FROM tour_pivots tp WHERE tp.tour_id = comments.service_id AND comments.service_type = 'tour' AND tp.deleted_at IS NULL AND tp.language_code = comments.language_code AND tp.title ILIKE ?)`,
									[like],
								)
								.orWhereRaw(
									`EXISTS (SELECT 1 FROM visa_pivots vp WHERE vp.visa_id = comments.service_id AND comments.service_type = 'visa' AND vp.deleted_at IS NULL AND vp.language_code = comments.language_code AND vp.title ILIKE ?)`,
									[like],
								)
						})
					}
				})

			const countRow = await base.clone().clearSelect().clearOrder().count<{ total: string }>("comments.id as total").first()
			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / limitNumber)

			const data = await base
				.clone()
				.select(
					"comments.id",
					"comments.service_type",
					"comments.service_id",
					"comments.reservation_id",
					"comments.comment",
					"comments.rating",
					"comments.language_code",
					"comments.created_at",
					"comments.updated_at",
					"users.id as user_id",
					"users.name_surname as user_name",
					"users.email as user_email",
					knex.raw(
						`CASE
							WHEN comments.service_type = 'hotel' THEN (
								SELECT hp.name
								FROM hotel_pivots hp
								WHERE hp.hotel_id = comments.service_id
									AND hp.language_code = comments.language_code
									AND hp.deleted_at IS NULL
								LIMIT 1
							)
							WHEN comments.service_type = 'car_rental' THEN (
								SELECT crp.title
								FROM car_rental_pivots crp
								WHERE crp.car_rental_id = comments.service_id
									AND crp.language_code = comments.language_code
									AND crp.deleted_at IS NULL
								LIMIT 1
							)
							WHEN comments.service_type = 'activity' THEN (
								SELECT ap.title
								FROM activity_pivots ap
								WHERE ap.activity_id = comments.service_id
									AND ap.language_code = comments.language_code
									AND ap.deleted_at IS NULL
								LIMIT 1
							)
							WHEN comments.service_type = 'tour' THEN (
								SELECT tp.title
								FROM tour_pivots tp
								WHERE tp.tour_id = comments.service_id
									AND tp.language_code = comments.language_code
									AND tp.deleted_at IS NULL
								LIMIT 1
							)
							WHEN comments.service_type = 'visa' THEN (
								SELECT vp.title
								FROM visa_pivots vp
								WHERE vp.visa_id = comments.service_id
									AND vp.language_code = comments.language_code
									AND vp.deleted_at IS NULL
								LIMIT 1
							)
						END AS service_title`
					),
					knex.raw("CASE WHEN comments.rating <= ? THEN true ELSE false END AS is_negative", [NEGATIVE_RATING_THRESHOLD]),
				)
				.orderBy("comments.created_at", "desc")
				.limit(limitNumber)
				.offset((pageNumber - 1) * limitNumber)

			const formattedData = data.map((item: any) => ({
				...item,
				is_negative: Boolean(item.is_negative),
			}))

			return res.status(200).send({
				success: true,
				message: req.t("COMMENTS.COMMENTS_FETCHED_SUCCESS") || "Yorumlar başarıyla getirildi",
				data: formattedData,
				recordsPerPageOptions: [10, 20, 50, 100],
				total,
				totalPages,
				currentPage: pageNumber,
				limit: limitNumber,
			})
		} catch (error) {
			console.error("Admin comments dataTable error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("COMMENTS.COMMENTS_FETCHED_ERROR") || "Yorumlar getirilirken bir hata oluştu",
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const commentModel = new CommentModel()
			const existingComment = await commentModel.first({ id })
			if (!existingComment) {
				return res.status(404).send({
					success: false,
					message: req.t("COMMENTS.COMMENT_NOT_FOUND") || "Yorum bulunamadı",
				})
			}

			await commentModel.delete(id)

			await recalculateAverageRating(
				existingComment.service_type,
				existingComment.service_id,
			)

			return res.status(200).send({
				success: true,
				message: req.t("COMMENTS.COMMENT_DELETED_SUCCESS") || "Yorum başarıyla kaldırıldı",
			})
		} catch (error) {
			console.error("Admin comment delete error:", error)
			return res.status(500).send({
				success: false,
				message: req.t("COMMENTS.COMMENT_DELETE_ERROR") || "Yorum kaldırılırken bir hata oluştu",
			})
		}
	}
}

async function recalculateAverageRating(serviceType: string, serviceId: string) {
	try {
		const commentModel = new CommentModel()
		const averageRating = await commentModel.getAverageRating(serviceType, serviceId)

		let model: HotelModel | CarRentalModel | ActivityModel | TourModel | VisaModel | null = null
		if (serviceType === "hotel") {
			model = new HotelModel()
		} else if (serviceType === "car_rental") {
			model = new CarRentalModel()
		} else if (serviceType === "activity") {
			model = new ActivityModel()
		} else if (serviceType === "tour") {
			model = new TourModel()
		} else if (serviceType === "visa") {
			model = new VisaModel()
		}

		if (model) {
			await model.update(serviceId, {
				average_rating: averageRating.average_rating,
				comment_count: averageRating.total_comments,
			})
		}
	} catch (error) {
		console.error("Admin comment recalculateAverageRating error:", error)
	}
}

