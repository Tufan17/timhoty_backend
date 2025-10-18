import { FastifyInstance } from "fastify"
import HotelPayment from "@/controllers/Payment/SalePartner/HotelPayment"
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware"
import WebhookController from "@/controllers/Payment/WebhookController"

export default async function paymentRoutes(fastify: FastifyInstance) {
	const hotelPayment = new HotelPayment()
	const webhookController = new WebhookController()
	// Hotel Payment Routes
	fastify.post("/hotel", {
		preHandler: [authSalesPartnerMiddleware],
		handler: hotelPayment.createPaymentIntent,
	})

	fastify.get("/hotel/status/:charge_id", {
		handler: hotelPayment.getPaymentStatus,
	})

	fastify.post("/hotel/refund", {
		handler: hotelPayment.createRefund,
	})

	fastify.get("/hotel/refund/:refund_id", {
		handler: hotelPayment.getRefundStatus,
	})

	fastify.get("/hotel/charges", {
		handler: hotelPayment.listCharges,
	})


	// Webhook Routes
	fastify.post("/webhook", {
		handler: webhookController.handleWebhook,
	})
}
