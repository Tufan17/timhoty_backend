import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import HotelRoomImageModel from "@/models/HotelRoomImageModel"
import HotelRoomModel from "@/models/HotelRoomModel"
import HotelModel from "@/models/HotelModel"

export default class HotelRoomImageController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				hotel_room_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				hotel_room_id?: string
			}

			// Base query
			const base = knex("hotel_room_images")
				.whereNull("hotel_room_images.deleted_at")
				.innerJoin("hotel_rooms", "hotel_room_images.hotel_room_id", "hotel_rooms.id")
				.whereNull("hotel_rooms.deleted_at")
				.modify(qb => {
					if (hotel_room_id) {
						qb.where("hotel_room_images.hotel_room_id", hotel_room_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("hotel_room_images.image_url", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("hotel_room_images.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("hotel_room_images.id")
				.select("hotel_room_images.*")
				.orderBy("hotel_room_images.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_SUCCESS"),
				data,
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
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { hotel_room_id } = req.query as { hotel_room_id?: string }

			let query = knex("hotel_room_images").whereNull("hotel_room_images.deleted_at").select("hotel_room_images.*")

			if (hotel_room_id) {
				query = query.where("hotel_room_images.hotel_room_id", hotel_room_id)
			}

			const images = await query.orderBy("created_at", "desc")

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_SUCCESS"),
				data: images,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const image = await new HotelRoomImageModel().first({ id })

			if (!image) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_SUCCESS"),
				data: image,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { hotel_room_id, images } = req.body as {
				hotel_room_id: string
				images: string | string[]
			}

			// Validate hotel_room_id
			const existingHotelRoom = await new HotelRoomModel().first({
				id: hotel_room_id,
			})

			if (!existingHotelRoom) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM.NOT_FOUND"),
				})
			}

			// Normalize images to array
			const imageUrls = Array.isArray(images) ? images : [images]
			const createdImages = []

			// Create hotel room images
			for (const imageUrl of imageUrls) {
				const image = await new HotelRoomImageModel().create({
					hotel_room_id,
					image_url: imageUrl,
				})
				createdImages.push(image)
			}

			await new HotelModel().update(existingHotelRoom.hotel_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.CREATED_SUCCESS"),
				data: createdImages,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { hotel_room_id, image_url } = req.body as {
				hotel_room_id?: string
				image_url?: string
			}

			// Check if anything to update
			if (!hotel_room_id && !image_url) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.NO_UPDATE_DATA"),
				})
			}

			// Check image existence
			const existingImage = await new HotelRoomImageModel().first({ id })

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.NOT_FOUND"),
				})
			}

			// Validate hotel room if hotel_room_id is provided
			if (hotel_room_id) {
				const hotelRoom = await new HotelRoomModel().exists({
					id: hotel_room_id,
				})

				if (!hotelRoom) {
					return res.status(400).send({
						success: false,
						message: req.t("HOTEL_ROOM.NOT_FOUND"),
					})
				}
			}

			// Prepare update data
			const updateData: any = {}
			if (hotel_room_id) updateData.hotel_room_id = hotel_room_id
			if (image_url) updateData.image_url = image_url

			// Update image
			const updatedImage = await new HotelRoomImageModel().update(id, updateData)

			await new HotelModel().update(existingImage.hotel_room.hotel_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.UPDATED_SUCCESS"),
				data: updatedImage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingImage = await new HotelRoomImageModel().exists({ id })

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.NOT_FOUND"),
				})
			}

			await new HotelRoomImageModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.DELETED_ERROR"),
			})
		}
	}

	async bulkDelete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { ids } = req.body as { ids: string[] }

			if (!ids || !Array.isArray(ids) || ids.length === 0) {
				return res.status(400).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.NO_IDS_PROVIDED"),
				})
			}

			// Check if all images exist
			const existingImages = await knex("hotel_room_images").whereIn("id", ids).whereNull("deleted_at")

			if (existingImages.length !== ids.length) {
				return res.status(404).send({
					success: false,
					message: req.t("HOTEL_ROOM_IMAGE.SOME_NOT_FOUND"),
				})
			}

			// Delete all images
			await knex("hotel_room_images").whereIn("id", ids).update({ deleted_at: new Date() })

			return res.status(200).send({
				success: true,
				message: req.t("HOTEL_ROOM_IMAGE.BULK_DELETED_SUCCESS"),
				data: { deletedCount: ids.length },
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("HOTEL_ROOM_IMAGE.BULK_DELETED_ERROR"),
			})
		}
	}
}
