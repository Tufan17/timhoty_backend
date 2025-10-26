import { FastifyReply } from "fastify"
import { FastifyRequest } from "fastify"
import { tapPaymentsService } from "@/services/Payment"
import dotenv from "dotenv"
import path from "path"
import ActivityReservationModel from "@/models/ActivityReservationModel"
import ActivityReservationUserModel from "@/models/ActivityReservationUserModel"
import ActivityReservationInvoiceModel from "@/models/ActivityReservationInvoiceModel"
dotenv.config({ path: path.resolve(__dirname, "../../../.env") })
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"

interface CreatePaymentRequest {
	amount: number
	currency?: string
	customer: {
		first_name: string
		last_name: string
		email: string
		phone?: {
			country_code: string
			number: string
		}
	}
	activity_id?: string
	application_id?: string
	description?: string
	redirect_url?: string
	post_url?: string
	booking_id?: string
	date?: string
	users?: {
		tax_office_address: string
		title: string
		tax_office: string
		tax_number: string
		official: string
		address: string
		name: string
		surname: string
		birthday: string
		email: string
		phone: string
		type: string
		age: number
	}[]
	different_invoice?: boolean
	package_id?: string
	hour_id?: string
}

interface PaymentStatusRequest {
	charge_id: string
}

interface RefundRequest {
	charge_id: string
	amount?: number
	reason?: string
	description?: string
}

class UserVisaPayment {
	/**
	 * Create a payment charge for visa application
	 */
	async createPaymentIntent(req: FastifyRequest<{ Body: CreatePaymentRequest }>, res: FastifyReply) {
		try {
			const { amount, currency = "USD", customer, activity_id, booking_id, description, date, users, different_invoice, package_id, hour_id } = req.body

			const user = (req as any).user
			// Validate required fields
			if (!amount || amount <= 0) {
				return res.status(400).send({
					success: false,
					message: "Geçerli bir tutar giriniz",
				})
			}

			if (!customer.first_name || !customer.last_name || !customer.email) {
				return res.status(400).send({
					success: false,
					message: "Müşteri bilgileri eksik",
				})
			}

			if (!activity_id || activity_id.trim() === "") {
				return res.status(400).send({
					success: false,
					message: "Activity ID is required",
				})
			}

			if (!users) {
				return res.status(400).send({
					success: false,
					message: "Müşteri bilgileri eksik",
				})
			}

			if (!package_id || package_id.trim() === "") {
				return res.status(400).send({
					success: false,
					message: "Package ID is required",
				})
			}

			if (!hour_id || hour_id.trim() === "") {
				return res.status(400).send({
					success: false,
					message: "Hour ID is required",
				})
			}

			// Create charge request
			const chargeRequest = {
				amount: Math.round(amount * 100), // Convert to smallest currency unit
				currency: currency,
				customer: {
					first_name: customer.first_name,
					last_name: customer.last_name,
					email: customer.email,
					phone: customer.phone,
				},
				description: description || `Activity payment - ${activity_id ? `Activity ID: ${activity_id}` : ""}`,
				redirect: {
					url: `${FRONTEND_URL}/reservation/activity-confirmation/${booking_id}`,
				},
				post: {
					url: `${FRONTEND_URL}/reservation/activity-confirmation/${booking_id}`,
				},
				metadata: {
					activity_id,
					booking_id,
					payment_type: "activity_booking",
					created_at: new Date().toISOString(),
				},
			}

			const paymentIntent = await tapPaymentsService.createCharge(chargeRequest)
			const reservationModel = new ActivityReservationModel()

			const existingReservation = await reservationModel.exists({
				progress_id: booking_id,
			})

			if (!existingReservation) {
				const body_form = {
					payment_id: paymentIntent.id,
					created_by: user.id,
					different_invoice: different_invoice,
					activity_id: activity_id,
					package_id: package_id,
					activity_package_hour_id: hour_id,
					status: false,
					progress_id: booking_id,
					date: date || new Date().toISOString().split("T")[0], // Use current date if not provided
					price: Number(amount) * 100,
					currency_code: currency,
				}
				const reservation = await reservationModel.create(body_form)

				const body_invoice = {
					activity_reservation_id: reservation.id,
					tax_office: different_invoice ? users?.[0]?.tax_office_address : "",
					title: different_invoice ? users?.[0]?.title : user.name_surname,
					tax_number: different_invoice ? users?.[0]?.tax_number : "",
					payment_id: paymentIntent.id,
					official: different_invoice ? users?.[0]?.official : "individual",
					address: different_invoice ? users?.[0]?.address : "",
				}

				const invoiceModel = new ActivityReservationInvoiceModel()
				const invoice = await invoiceModel.create(body_invoice)

				if (users && users.length > 0) {
					for (const user of users) {
						const body_user = {
							activity_reservation_id: reservation.id,
							name: user.name,
							surname: user.surname,
							birthday: user.birthday,
							email: user.email,
							phone: user.phone,
							type: user.type,
							age: user.age,
						}
						const userModel = new ActivityReservationUserModel()
						await userModel.create(body_user)
					}
				}
			}

			return res.status(200).send({
				success: true,
				message: "Payment intent created successfully",
				data: {
					charge_id: paymentIntent.id,
					status: paymentIntent.status,
					amount: paymentIntent.amount / 100, // Convert back to main currency unit
					currency: paymentIntent.currency,
					redirect_url: paymentIntent.redirect?.url,
					payment_url: paymentIntent.transaction?.url, // Tap Payments URL'si transaction.url'de
					created_at: paymentIntent.created ? new Date(paymentIntent.created * 1000).toISOString() : new Date().toISOString(),
				},
			})
		} catch (error: any) {
			console.error("Activity Payment Error:", error)
			return res.status(500).send({
				success: false,
				message: "Payment intent creation failed",
				error: error.message,
			})
		}
	}

	/**
	 * Get payment status
	 */
	async getPaymentStatus(req: FastifyRequest<{ Params: PaymentStatusRequest }>, res: FastifyReply) {
		try {
			const { charge_id } = req.params

			if (!charge_id) {
				return res.status(400).send({
					success: false,
					message: "Charge ID is required",
				})
			}

			// charge_id kontrolü
			if (!charge_id) {
				return res.status(400).send({
					success: false,
					message: "Charge ID is required",
				})
			}

			// charge bilgisini al
			const charge = await tapPaymentsService.getCharge(charge_id)

			const reservationModel = new ActivityReservationModel()

			// // rezervasyon bilgisini al
			const reservation = await reservationModel.getReservationByPaymentId(charge_id)

			// // rezervasyon bulunamadıysa hata dön
			if (!reservation) {
				return res.status(400).send({
					success: false,
					message: "Reservation not found",
				})
			}

			// // charge status CAPTURED ise rezervasyonu güncelle
			if (charge.status === "CAPTURED") {
				await reservationModel.update(reservation.id, { status: true })
			}

			// rezervasyon bilgisini dön
			return res.status(200).send({
				success: true,
				message: "Payment status retrieved successfully",
				data: {
					charge_id: charge.id,
					status: charge.status,
					amount: charge.amount / 100,
					currency: charge.currency,
					customer: charge.customer,
					created_at: charge.created ? new Date(charge.created * 1000).toISOString() : new Date().toISOString(),
					url: charge.url,
				},
			})
		} catch (error: any) {
			console.error("Payment Status Error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve payment status",
				error: error.message,
			})
		}
	}

	/**
	 * Create a refund
	 */
	async createRefund(req: FastifyRequest<{ Body: RefundRequest }>, res: FastifyReply) {
		try {
			const { charge_id, amount, reason, description } = req.body

			if (!charge_id) {
				return res.status(400).send({
					success: false,
					message: "Charge ID is required",
				})
			}

			const refundRequest = {
				charge_id,
				amount: amount ? Math.round(amount * 100) : undefined, // Convert to smallest currency unit
				reason: reason || "requested_by_customer",
				description: description || "Activity booking refund",
				metadata: {
					refund_type: "activity_booking",
					created_at: new Date().toISOString(),
				},
			}

			const refund = await tapPaymentsService.createRefund(refundRequest)

			return res.status(200).send({
				success: true,
				message: "Refund created successfully",
				data: {
					refund_id: refund.id,
					status: refund.status,
					amount: refund.amount / 100,
					currency: refund.currency,
					charge_id: refund.charge_id,
					created_at: refund.created ? new Date(refund.created * 1000).toISOString() : new Date().toISOString(),
				},
			})
		} catch (error: any) {
			console.error("Refund Error:", error)
			return res.status(500).send({
				success: false,
				message: "Refund creation failed",
				error: error.message,
			})
		}
	}

	/**
	 * Get refund status
	 */
	async getRefundStatus(req: FastifyRequest<{ Params: { refund_id: string } }>, res: FastifyReply) {
		try {
			const { refund_id } = req.params

			if (!refund_id) {
				return res.status(400).send({
					success: false,
					message: "Refund ID is required",
				})
			}

			const refund = await tapPaymentsService.getRefund(refund_id)

			return res.status(200).send({
				success: true,
				message: "Refund status retrieved successfully",
				data: {
					refund_id: refund.id,
					status: refund.status,
					amount: refund.amount / 100,
					currency: refund.currency,
					charge_id: refund.charge_id,
					created_at: refund.created ? new Date(refund.created * 1000).toISOString() : new Date().toISOString(),
				},
			})
		} catch (error: any) {
			console.error("Refund Status Error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve refund status",
				error: error.message,
			})
		}
	}
}

export default UserVisaPayment
