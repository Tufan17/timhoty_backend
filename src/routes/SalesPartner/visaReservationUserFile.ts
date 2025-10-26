// src/routes/User/visaReservationUserFile.ts
import { FastifyInstance } from "fastify"
import VisaReservationUserFileController from "../../controllers/SalePartner/VisaReservationUserFileController"
import { makeAuditLogger } from "../../middlewares/logMiddleware"
import { visaReservationUserFileSchema } from "@/validators/Visa/visaReservationUserFile"
import VisaReservationUserFileModel from "@/models/VisaReservationUserFileModel"
import { validateFormDataMultiple } from "@/middlewares/validateFormData"
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware"

export default async function visaReservationUserFileRoutes(fastify: FastifyInstance) {
	const visaReservationUserFileController = new VisaReservationUserFileController()

	const visaReservationUserFileAuditLogger = makeAuditLogger({
		targetName: "visa_reservation_user_files",
		model: new VisaReservationUserFileModel(),
		idParam: "id",
		getUser: request => (request as any).user || {},
	})

	fastify.get("/:visa_reservation_id", {
		preHandler: [authSalesPartnerMiddleware],
		handler: visaReservationUserFileController.findAll,
	})

	// fastify.get("/file/:id", {
	//   preHandler: [authUserMiddleware],
	//   handler: visaReservationUserFileController.findOne,
	// });

	fastify.delete("/:id", {
		preHandler: [authSalesPartnerMiddleware],
		handler: visaReservationUserFileController.delete,
	})

	fastify.post("/", {
		preHandler: [authSalesPartnerMiddleware, visaReservationUserFileAuditLogger],
		preValidation: [validateFormDataMultiple(visaReservationUserFileSchema)],
		handler: visaReservationUserFileController.create,
	})
}
