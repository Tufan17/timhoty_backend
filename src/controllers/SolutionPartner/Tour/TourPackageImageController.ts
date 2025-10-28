import { FastifyRequest, FastifyReply } from "fastify"
import TourPackageImageModel from "@/models/TourPackageImageModel"
import TourPackageModel from "@/models/TourPackageModel"
import TourModel from "@/models/TourModel"

export default class TourPackageImageController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { tour_package_id } = req.query as { tour_package_id?: string }

			let images
			if (tour_package_id) {
				images = await new TourPackageImageModel().getByTourPackageId(tour_package_id)
			} else {
				images = await new TourPackageImageModel().getAll()
			}

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGES_FETCHED_SUCCESS"),
				data: images,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGES_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const image = await new TourPackageImageModel().findId(id)

			if (!image) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_FETCHED_SUCCESS"),
				data: image,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { tour_package_id, images } = req.body as {
				tour_package_id: string
				images: string | string[]
			}

			// Validate hotel_room_id
			const existingTourPackage = await new TourPackageModel().exists({
				id: tour_package_id,
			})

			if (!existingTourPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR_PACKAGE.NOT_FOUND"),
				})
			}

			// Normalize images to array
			const imageUrls = Array.isArray(images) ? images : [images]
			const createdImages = []

			// Create hotel room images
			for (const imageUrl of imageUrls) {
				const image = await new TourPackageImageModel().create({
					tour_package_id,
					image_url: imageUrl,
				})
				createdImages.push(image)
			}
			const tourPackage = await new TourPackageModel().first({
				id: tour_package_id,
			})
			if (!tourPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR_PACKAGE.NOT_FOUND"),
				})
			}

			await new TourModel().update(tourPackage.tour_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_CREATED_SUCCESS"),
				data: createdImages,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_CREATED_ERROR"),
			})
		}
	}
	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { image_url } = req.body as { image_url: string }

			const existingImage = await new TourPackageImageModel().findId(id)
			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			const updatedImage = await new TourPackageImageModel().update(id, {
				image_url,
			})
			await new TourModel().update(existingImage.tour_package.tour_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_UPDATED_SUCCESS"),
				data: updatedImage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingImage = await new TourPackageImageModel().findId(id)

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			await new TourPackageImageModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGE_DELETED_ERROR"),
			})
		}
	}

	async deleteByTourPackageId(req: FastifyRequest, res: FastifyReply) {
		try {
			const { tour_package_id } = req.params as { tour_package_id: string }

			// Validate car rental package exists
			const existingTourPackage = await new TourPackageModel().findId(tour_package_id)
			if (!existingTourPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("TOUR_PACKAGE.TOUR_PACKAGE_NOT_FOUND"),
				})
			}

			const deletedCount = await new TourPackageImageModel().deleteByTourPackageId(tour_package_id)

			return res.status(200).send({
				success: true,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGES_DELETED_SUCCESS"),
				data: { deleted_count: deletedCount },
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("TOUR_PACKAGE_IMAGE.IMAGES_DELETED_ERROR"),
			})
		}
	}
}
