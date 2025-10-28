import { FastifyRequest, FastifyReply } from "fastify"
import CarRentalPackageImageModel from "@/models/CarRentalPackageImageModel"
import CarRentalPackageModel from "@/models/CarRentalPackageModel"
import CarRentalModel from "@/models/CarRentalModel"

export default class CarRentalPackageImageController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_package_id } = req.query as { car_rental_package_id?: string }

			let images
			if (car_rental_package_id) {
				images = await new CarRentalPackageImageModel().getByCarRentalPackageId(car_rental_package_id)
			} else {
				images = await new CarRentalPackageImageModel().getAll()
			}

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGES_FETCHED_SUCCESS"),
				data: images,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGES_FETCHED_ERROR"),
			})
		}
	}

	async findOne(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const image = await new CarRentalPackageImageModel().findId(id)

			if (!image) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_FETCHED_SUCCESS"),
				data: image,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_FETCHED_ERROR"),
			})
		}
	}

	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_package_id, images } = req.body as {
				car_rental_package_id: string
				images: string | string[]
			}

			// Validate hotel_room_id
			const existingCarRentalPackage = await new CarRentalPackageModel().first({
				id: car_rental_package_id,
			})

			if (!existingCarRentalPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}

			// Normalize images to array
			const imageUrls = Array.isArray(images) ? images : [images]
			const createdImages = []

			// Create hotel room images
			for (const imageUrl of imageUrls) {
				const image = await new CarRentalPackageImageModel().create({
					car_rental_package_id,
					image_url: imageUrl,
				})
				createdImages.push(image)
			}

			await new CarRentalModel().update(existingCarRentalPackage.car_rental_id, {
				status: false,
				admin_approval: false,
			})
			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_CREATED_SUCCESS"),
				data: createdImages,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_CREATED_ERROR"),
			})
		}
	}
	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const { image_url } = req.body as { image_url: string }

			const existingImage = await new CarRentalPackageImageModel().findId(id)
			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			const updatedImage = await new CarRentalPackageImageModel().update(id, {
				image_url,
			})
			const carRentalPackage = await new CarRentalPackageModel().first({
				id: existingImage.car_rental_package_id,
			})
			if (!carRentalPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.NOT_FOUND"),
				})
			}
			await new CarRentalModel().update(carRentalPackage.car_rental_id, {
				status: false,
				admin_approval: false,
			})

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_UPDATED_SUCCESS"),
				data: updatedImage,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_UPDATED_ERROR"),
			})
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const existingImage = await new CarRentalPackageImageModel().findId(id)

			if (!existingImage) {
				return res.status(404).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_NOT_FOUND"),
				})
			}

			await new CarRentalPackageImageModel().delete(id)

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_DELETED_SUCCESS"),
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGE_DELETED_ERROR"),
			})
		}
	}

	async deleteByCarRentalPackageId(req: FastifyRequest, res: FastifyReply) {
		try {
			const { car_rental_package_id } = req.params as { car_rental_package_id: string }

			// Validate car rental package exists
			const existingCarRentalPackage = await new CarRentalPackageModel().findId(car_rental_package_id)
			if (!existingCarRentalPackage) {
				return res.status(400).send({
					success: false,
					message: req.t("CAR_RENTAL_PACKAGE.CAR_RENTAL_PACKAGE_NOT_FOUND"),
				})
			}

			const deletedCount = await new CarRentalPackageImageModel().deleteByCarRentalPackageId(car_rental_package_id)

			return res.status(200).send({
				success: true,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGES_DELETED_SUCCESS"),
				data: { deleted_count: deletedCount },
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("CAR_RENTAL_PACKAGE_IMAGE.IMAGES_DELETED_ERROR"),
			})
		}
	}
}
