import { FastifyRequest, FastifyReply } from "fastify"
import ActivityPackageImageModel from "@/models/ActivityPackageImageModel"
import ActivityPackageModel from "@/models/ActivityPackageModel"
import ActivityModel from "@/models/ActivityModel"

export default class ActivityPackageImageController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id } = req.query as { activity_package_id?: string }

			let images
			if (activity_package_id) {
				images = await new ActivityPackageImageModel().getByActivityPackageId(activity_package_id)
			} else {
				images = await new ActivityPackageImageModel().getAll()
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGES_FETCHED_SUCCESS"),
				data: images,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGES_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const image = await new ActivityPackageImageModel().findId(id)

			if (!image) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_FETCHED_SUCCESS"),
				data: image,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id, images } = req.body as {
				activity_package_id: string
				images: string | string[]
			}

			// Validate hotel_room_id
			const existingActivityPackage = await new ActivityPackageModel().first({
				id: activity_package_id,
			})

			if (!existingActivityPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.NOT_FOUND"),
				})
			}
			await new ActivityModel().update(existingActivityPackage?.activity_id, { admin_approval: false, status: false })

			// Normalize images to array
			const imageUrls = Array.isArray(images) ? images : [images]
			const createdImages = []

			// Create hotel room images
			for (const imageUrl of imageUrls) {
				const image = await new ActivityPackageImageModel().create({
					activity_package_id,
					image_url: imageUrl,
				})
				createdImages.push(image)
			}

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_CREATED_SUCCESS"),
				data: createdImages,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_CREATED_ERROR"),
			})
		}
	}
	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { image_url } = req.body as { image_url: string }

			const existingImage = await new ActivityPackageImageModel().first({ id })
			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			const updatedImage = await new ActivityPackageImageModel().update(id, {
				image_url,
			})

			await new ActivityModel().update(existingImage?.activity_package?.activity_id, { admin_approval: false, status: false })
			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_UPDATED_SUCCESS"),
				data: updatedImage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingImage = await new ActivityPackageImageModel().findId(id)

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			await new ActivityPackageImageModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGE_DELETED_ERROR"),
			})
		}
	}

	async deleteByActivityPackageId(req: FastifyRequest, res: FastifyReply) {
		try {
			const { activity_package_id } = req.params as { activity_package_id: string }

			// Validate car rental package exists
			const existingActivityPackage = await new ActivityPackageModel().findId(activity_package_id)
			if (!existingActivityPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("ACTIVITY_PACKAGE.ACTIVITY_PACKAGE_NOT_FOUND"),
				})
			}

			const deletedCount = await new ActivityPackageImageModel().deleteByActivityPackageId(activity_package_id)

			return res.status(200).send({
				success: true,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGES_DELETED_SUCCESS"),
				data: { deleted_count: deletedCount },
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("ACTIVITY_PACKAGE_IMAGE.IMAGES_DELETED_ERROR"),
			})
		}
	}
}
