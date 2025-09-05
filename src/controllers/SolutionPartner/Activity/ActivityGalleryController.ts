import { FastifyRequest, FastifyReply } from "fastify"
import knex from "../../../db/knex"
import ActivityGalleryModel from "@/models/ActivityGalleryModel"
import ActivityGalleryPivotModel from "@/models/ActivityGalleryPivot"
import ActivityModel from "@/models/ActivityModel"
import { translateCreate } from "@/helper/translate"

export default class ActivityGalleryController {
	async dataTable(req: FastifyRequest, res: FastifyReply) {
		try {
			const {
				page = 1,
				limit = 10,
				search = "",
				activity_id,
			} = req.query as {
				page: number
				limit: number
				search: string
				activity_id?: string
			}

			const language = req.language || "en"

			// Base query
			const base = knex("activity_galleries")
				.whereNull("activity_galleries.deleted_at")
				.innerJoin("activities", "activity_galleries.activity_id", "activities.id")
				.leftJoin("activity_gallery_pivots", "activity_galleries.id", "activity_gallery_pivots.activity_gallery_id")
				.where("activity_gallery_pivots.language_code", language)
				.whereNull("activities.deleted_at")
				.whereNull("activity_gallery_pivots.deleted_at")
				.modify(qb => {
					if (activity_id) {
						qb.where("activity_galleries.activity_id", activity_id)
					}

					if (search) {
						const like = `%${search}%`
						qb.andWhere(w => {
							w.where("activity_galleries.image_type", "ilike", like).orWhere("activity_gallery_pivots.category", "ilike", like)
						})
					}
				})

			// Count total records
			const countRow = await base.clone().clearSelect().clearOrder().countDistinct<{ total: string }>("activity_galleries.id as total").first()

			const total = Number(countRow?.total ?? 0)
			const totalPages = Math.ceil(total / Number(limit))

			// Get data
			const data = await base
				.clone()
				.distinct("activity_galleries.id")
				.select("activity_galleries.*", "activity_gallery_pivots.category")
				.orderBy("activity_galleries.created_at", "desc")
				.limit(Number(limit))
				.offset((Number(page) - 1) * Number(limit))

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.FETCHED_SUCCESS"),
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
				message: req.t("ACTIVITY_GALLERY.FETCHED_ERROR"),
			})
		}
	}

	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_id } = req.query as { activity_id?: string }
			const language = req.language || "en"

			let query = knex("activity_galleries").whereNull("activity_galleries.deleted_at").leftJoin("activity_gallery_pivots", "activity_galleries.id", "activity_gallery_pivots.activity_gallery_id").where("activity_gallery_pivots.language_code", language).whereNull("activity_gallery_pivots.deleted_at").select("activity_galleries.*", "activity_gallery_pivots.category")

			if (activity_id) {
				query = query.where("activity_galleries.activity_id", activity_id)
			}

			const images = await query.orderBy("activity_galleries.created_at", "desc")

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.FETCHED_SUCCESS"),
				data: images,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const language = req.language || "en"

			const image = await knex("activity_galleries").whereNull("activity_galleries.deleted_at").leftJoin("activity_gallery_pivots", "activity_galleries.id", "activity_gallery_pivots.activity_gallery_id").where("activity_gallery_pivots.language_code", language).whereNull("activity_gallery_pivots.deleted_at").where("activity_galleries.id", id).select("activity_galleries.*", "activity_gallery_pivots.category").first()

			if (!image) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.FETCHED_SUCCESS"),
				data: image,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_id, category, images } = req.body as {
				activity_id: string
				category: string
				images: string | string[]
			}

			// Validate activity_id
			const existingActivity = await new ActivityModel().exists({
				id: activity_id,
			})

			if (!existingActivity) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY.NOT_FOUND"),
				})
			}

			// Normalize images to array
			const imageUrls = Array.isArray(images) ? images : [images]
			const createdImages = []

			// Create activity images
			for (const imageUrl of imageUrls) {
				let image_type = ""

				if (imageUrl.includes(".mp4") || imageUrl.includes(".mov") || imageUrl.includes(".webm") || imageUrl.includes(".avi") || imageUrl.includes(".wmv") || imageUrl.includes(".flv") || imageUrl.includes(".mkv")) {
					image_type = "video"
				} else {
					image_type = "image"
				}

				const image = await new ActivityGalleryModel().create({
					activity_id,
					image_type,
					image_url: imageUrl,
				})

				// Create translations
				await translateCreate({
					target: "activity_gallery_pivots",
					target_id: image.id,
					target_id_key: "activity_gallery_id",
					data: {
						category,
					},
					language_code: req.language,
				})
				createdImages.push(image)
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.CREATED_SUCCESS"),
				data: createdImages,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.CREATED_ERROR"),
			})
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { activity_id, image_type, category } = req.body as {
				activity_id?: string
				image_type?: string
				category?: string
			}

			// Check if anything to update
			if (!activity_id && !image_type && !category) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.NO_UPDATE_DATA"),
				})
			}

			// Check image existence
			const existingImage = await new ActivityGalleryModel().exists({ id })

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.NOT_FOUND"),
				})
			}

			// Validate activity if activity_id is provided
			if (activity_id) {
				const activity = await new ActivityModel().exists({
					id: activity_id,
				})

				if (!activity) {
					return res.status(400).send({
						success: false,
						message: req.t("ACTIVITY.NOT_FOUND"),
					})
				}
			}

			// Prepare update data
			const updateData: any = {}
			if (activity_id) updateData.activity_id = activity_id
			if (image_type) updateData.image_type = image_type
			if (category) updateData.category = category

			// Update image
			const updatedImage = await new ActivityGalleryModel().update(id, updateData)

			// Update translations if provided
			if (category) {
				await knex("activity_gallery_pivots").where({ activity_gallery_id: id }).update({ deleted_at: new Date() })

				const newTranslations = await translateCreate({
					target: "activity_gallery_pivots",
					target_id: id,
					target_id_key: "activity_gallery_id",
					data: {
						category,
					},
					language_code: req.language,
				})

				updatedImage.translations = newTranslations
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.UPDATED_SUCCESS"),
				data: updatedImage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingImage = await new ActivityGalleryModel().exists({ id })

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.NOT_FOUND"),
				})
			}

			await knex.transaction(async trx => {
				// Soft delete main record
				await trx("activity_galleries").where({ id }).update({ deleted_at: new Date() })

				// Soft delete translations
				await trx("activity_gallery_pivots").where({ activity_gallery_id: id }).update({ deleted_at: new Date() })
			})

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.DELETED_ERROR"),
			})
		}
	}

	async bulkDelete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { ids } = req.body as { ids: string[] }

			if (!ids || !Array.isArray(ids) || ids.length === 0) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.NO_IDS_PROVIDED"),
				})
			}

			// Check if all images exist
			const existingImages = await knex("activity_galleries").whereIn("id", ids).whereNull("deleted_at")

			if (existingImages.length !== ids.length) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_GALLERY.SOME_NOT_FOUND"),
				})
			}

			// Delete all images and their translations
			await knex.transaction(async trx => {
				// Soft delete main records
				await trx("activity_galleries").whereIn("id", ids).update({ deleted_at: new Date() })

				// Soft delete translations
				await trx("activity_gallery_pivots").whereIn("activity_gallery_id", ids).update({ deleted_at: new Date() })
			})

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_GALLERY.BULK_DELETED_SUCCESS"),
				data: { deletedCount: ids.length },
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_GALLERY.BULK_DELETED_ERROR"),
			})
		}
	}
}
