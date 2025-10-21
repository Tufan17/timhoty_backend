// src/controllers/User/VisaReservationUserFileController.ts
import { FastifyRequest, FastifyReply } from "fastify"
import VisaReservationUserFileModel from "@/models/VisaReservationUserFileModel"
import VisaReservationModel from "@/models/VisaReservationModel"

export default class VisaReservationUserFileController {
	async findAll(req: FastifyRequest, res: FastifyReply) {
		try {
			const { visa_reservation_id } = req.params as { visa_reservation_id: string }

			const files = await new VisaReservationUserFileModel().where("visa_reservation_id", visa_reservation_id)

			return res.status(200).send({
				success: true,
				message: req.t("VISA_RESERVATION_USER_FILE.FILES_FETCHED_SUCCESS"),
				data: files,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_RESERVATION_USER_FILE.FILES_FETCHED_ERROR"),
			})
		}
	}
	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const { visa_reservation_id, files } = req.body as {
				visa_reservation_id: string
				files: string | string[]
			}

			// Check if visa reservation user exists
			const visaReservation = await new VisaReservationModel().first({
				id: visa_reservation_id,
			})

			if (!visaReservation) {
				return res.status(400).send({
					success: false,
					message: req.t("VISA_RESERVATION.NOT_FOUND"),
				})
			}

			// Normalize files to array
			const fileUrls = Array.isArray(files) ? files : [files]
			const createdFiles = []

			// Create files for each uploaded file
			for (const fileUrl of fileUrls) {
				// Determine file type based on extension
				let file_type = "image"
				let file_name = fileUrl.split("/").pop() || "unknown"

				if (fileUrl.includes(".pdf")) {
					file_type = "pdf"
				} else if (fileUrl.includes(".mp4") || fileUrl.includes(".mov") || fileUrl.includes(".webm") || fileUrl.includes(".avi") || fileUrl.includes(".wmv") || fileUrl.includes(".flv") || fileUrl.includes(".mkv")) {
					file_type = "video"
				}

				const file = await new VisaReservationUserFileModel().create({
					visa_reservation_id,
					file_url: fileUrl,
					file_name,
					file_type,
				})

				createdFiles.push(file)
			}

			return res.status(200).send({
				success: true,
				message: req.t("VISA_RESERVATION_USER_FILE.FILES_CREATED_SUCCESS"),
				data: createdFiles,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: req.t("VISA_RESERVATION_USER_FILE.FILES_CREATED_ERROR"),
			})
		}
	}
}
