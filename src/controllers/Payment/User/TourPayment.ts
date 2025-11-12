import { FastifyReply } from "fastify"
import { FastifyRequest } from "fastify"
import { tapPaymentsService } from "@/services/Payment"
import TourReservationModel from "@/models/TourReservationModel"
import TourReservationInvoiceModel from "@/models/TourReservationInvoiceModel"
import TourReservationUserModel from "@/models/TourReservationUserModel"
import DiscountUserModel from "@/models/DiscountUserModel"
import UserModel from "@/models/UserModel"
import TourModel from "@/models/TourModel"

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
	tour_id?: string
	booking_id?: string
	description?: string
	redirect_url?: string
	post_url?: string
	period?: string
	tour_package_price_id?: string
	users?: {
		tax_office_address: string
		title: string
		tax_office: string
		tax_number: string
		official: string
		address: string
		name: string
		surname: string
		birthDate: string
		email: string
		phone: string
		type: string
		age: number
		room: number
	}[]
	different_invoice?: boolean
	package_id?: string
	discount?: {
		id: string
		code: string
		service_type: string
		amount: string
		percentage: string
	}
	invoice_title?: string
	invoice_official?: string
	invoice_tax_number?: string
	invoice_tax_office_address?: string
	invoice_address?: string
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

class UserTourPayment {
	/**
	 * Create a payment charge for tour booking
	 */
	async createPaymentIntent(req: FastifyRequest<{ Body: CreatePaymentRequest }>, res: FastifyReply) {
		try {
			const { amount, currency = "USD", customer, tour_id, booking_id, description, period, users, different_invoice, package_id, discount, tour_package_price_id, invoice_title, invoice_official, invoice_tax_number, invoice_tax_office_address, invoice_address } = req.body

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

			if (!tour_id) {
				return res.status(400).send({
					success: false,
					message: "Tour ID is required",
				})
			}

			if (!users) {
				return res.status(400).send({
					success: false,
					message: "Müşteri bilgileri eksik",
				})
			}

			// Create charge request
			const chargeRequest = {
				amount: amount, // Convert to smallest currency unit
				currency: currency,
				customer: {
					first_name: customer.first_name,
					last_name: customer.last_name,
					email: customer.email,
					phone: customer.phone,
				},
				description: description || `Tour payment - ${tour_id ? `Tour ID: ${tour_id}` : ""}`,
				redirect: {
					url: `${FRONTEND_URL}/reservation/tour-confirmation/${booking_id}`,
				},
				post: {
					url: `${FRONTEND_URL}/reservation/tour-confirmation/${booking_id}`,
				},
				metadata: {
					tour_id,
					booking_id,
					payment_type: "tour_booking",
					created_at: new Date().toISOString(),
				},
			}

			const paymentIntent = await tapPaymentsService.createCharge(chargeRequest)
			const reservationModel = new TourReservationModel()

			const existingReservation = await reservationModel.exists({
				progress_id: booking_id,
			})

			if (!existingReservation) {
				if (discount && discount.id) {
					const discountUserModel = new DiscountUserModel()
					await discountUserModel.create({
						discount_code_id: discount.id,
						user_id: user.id,
						status: false,
						payment_id: paymentIntent.id,
					})
				}
				const body_form = {
					payment_id: paymentIntent.id,
					created_by: user.id,
					different_invoice: different_invoice,
					tour_id: tour_id,
					package_id: package_id,
					status: false,
					progress_id: booking_id,
					period: period || new Date().toISOString().split("T")[0], // Use current date if not provided
					price: Number(amount),
					currency_code: currency,
					tour_package_price_id: tour_package_price_id,
				}
				const reservation = await reservationModel.create(body_form)

				const body_invoice = {
					tour_reservation_id: reservation.id,
					tax_office: invoice_tax_office_address,
					title: invoice_title,
					tax_number: invoice_tax_number,
					payment_id: paymentIntent.id,
					official: invoice_official,
					address: invoice_address,
				}

				const invoiceModel = new TourReservationInvoiceModel()

				const invoice = await invoiceModel.create(body_invoice)

				if (users && users.length > 0) {
					for (const user of users) {
						const body_user = {
							tour_reservation_id: reservation.id,
							name: user.name,
							surname: user.surname,
							birthday: user.birthDate,
							email: user.email,
							phone: user.phone,
							type: user.type,
							age: user.age,
							room: user.room,
						}
						const userModel = new TourReservationUserModel()
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
			console.error("Tour Payment Error:", error)
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

			const charge = await tapPaymentsService.getCharge(charge_id)
			const reservationModel = new TourReservationModel()
			const reservation = await reservationModel.getReservationByPaymentId(charge_id)
			if (!reservation) {
				return res.status(400).send({
					success: false,
					message: "Reservation not found",
				})
			}

			if (charge.status === "CAPTURED") {
				await reservationModel.update(reservation.id, { status: true })
				const discountUserModel = new DiscountUserModel()
				const existingDiscountUser = await discountUserModel.first({
					payment_id: charge_id,
				})
				if (existingDiscountUser) {
					await discountUserModel.update(existingDiscountUser.id, {
						status: true,
					})
				}
				const updatedReservation = await reservationModel.first({ id: reservation.id })

				if (updatedReservation && updatedReservation.status === true) {
					const user = await new UserModel().first({ id: updatedReservation.created_by })

					if (user) {
						const reservationDetails = await reservationModel.getReservationWithDetails(updatedReservation.id, user.language || "en")

						await reservationConfirmationEmail(user.email, user.name_surname, reservationDetails || updatedReservation, user.language || "tr")
						if (reservationDetails && reservationDetails.tour_id) {
							await sendPartnerNotificationEmail(reservationDetails, user)
						}
					}
				}
			}
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
				description: description || "Tour booking refund",
				metadata: {
					refund_type: "tour_booking",
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
async function reservationConfirmationEmail(email: string, name: string, reservationDetails: any, language: string = "tr") {
	try {
		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")

		// Dil bazlı template dosyası seçimi
		const templateFileName = language === "en" ? "reservation-en.html" : "reservation.html"
		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const emailHtml = fs.readFileSync(emailTemplatePath, "utf8")

		const uploadsUrl = process.env.UPLOADS_URL
		let html = emailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)

		html = html.replace(/\{\{name\}\}/g, name)
		html = html.replace(/\{\{title\}\}/g, reservationDetails.tour_title || "")

		html = html.replace(/\{\{city\}\}/g, reservationDetails.tour_city || "")
		html = html.replace(/\{\{country\}\}/g, reservationDetails.tour_country || "")

// City varsa city+country section'ı göster, yoksa sadece country section'ı göster
		if (reservationDetails.tour_city && reservationDetails.tour_city.trim() !== "") {
			// City varsa: COUNTRY_ONLY_SECTION ve COUNTRY_LOCATION_SECTION'ı kaldır
			html = html.replace(/<!-- \{\{COUNTRY_ONLY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{COUNTRY_ONLY_SECTION_END\}\} -->/g, "")
			html = html.replace(/<!-- \{\{COUNTRY_LOCATION_SECTION_START\}\} -->[\s\S]*?<!-- \{\{COUNTRY_LOCATION_SECTION_END\}\} -->/g, "")
		} else {
			// City yoksa: CITY_SECTION ve LOCATION_SECTION'ı kaldır
			html = html.replace(/<!-- \{\{CITY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{CITY_SECTION_END\}\} -->/g, "")
			html = html.replace(/<!-- \{\{LOCATION_SECTION_START\}\} -->[\s\S]*?<!-- \{\{LOCATION_SECTION_END\}\} -->/g, "")
		}


		html = html.replace(/\{\{image\}\}/g, reservationDetails.tour_image ? `${uploadsUrl}${reservationDetails.tour_image}` : `${uploadsUrl}/uploads/no-file.png`)

		const formattedDate = reservationDetails.package_date
			? new Date(reservationDetails.package_date).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
					year: "numeric",
					month: "long",
					day: "numeric",
			  })
			: ""

		html = html.replace(/\{\{date\}\}/g, formattedDate)

		if (reservationDetails.activity_hour) {
			const minute = reservationDetails.activity_minute || "00"
			html = html.replace(/\{\{hour\}\}/g, reservationDetails.activity_hour.toString())
			html = html.replace(/\{\{minute\}\}/g, minute.toString())
		} else {
			html = html.replace(/<!-- \{\{HOUR_SECTION_START\}\} -->[\s\S]*?<!-- \{\{HOUR_SECTION_END\}\} -->/g, "")
		}
		const guestsCount = reservationDetails.guests ? (Array.isArray(reservationDetails.guests) ? reservationDetails.guests.length : 1) : 1
		html = html.replace(/\{\{guests\}\}/g, guestsCount.toString())

		const priceInMainCurrency = (reservationDetails.price ).toFixed(2)
		html = html.replace(/\{\{price\}\}/g, priceInMainCurrency)
		html = html.replace(/\{\{total\}\}/g, priceInMainCurrency)
		html = html.replace(/\{\{currency\}\}/g, reservationDetails.currency_code || "USD")

		html = html.replace(/\{\{#if discount\}\}[\s\S]*?\{\{\/if\}\}/g, "")
		html = html.replace(/\{\{discount\}\}/g, "0")

		const emailSubject = language === "en" ? "Timhoty - Reservation Confirmation" : "Timhoty - Rezervasyon Onayı"

		await sendMail(email, emailSubject, html)
	} catch (error) {
		console.error("Reservation confirmation email error:", error)
	}
}
async function sendPartnerNotificationEmail(reservationDetails: any, customer: any) {
	try {

		const SolutionPartnerUserModel = (await import("@/models/SolutionPartnerUserModel")).default

		const tour = await new TourModel().first({ id: reservationDetails.tour_id })

		if (!tour || !tour.solution_partner_id) {
			console.log("Tour has no solution partner")
			return
		}

		// Solution partner'ın manager kullanıcısını bul
		const managerUser = await new SolutionPartnerUserModel().first({
			solution_partner_id: tour.solution_partner_id,
			type: "manager"
		})

		if (!managerUser) {
			console.log("Solution partner manager not found")
			return
		}

		const sendMail = (await import("@/utils/mailer")).default
		const path = require("path")
		const fs = require("fs")

		// Dil bazlı template dosyası seçimi
		const language = managerUser.language_code || "tr"
		const templateFileName = language === "en"
			? "reservation_solution_en.html"
			: "reservation_solution_tr.html"

		const emailTemplatePath = path.join(process.cwd(), "emails", templateFileName)
		const emailHtml = fs.readFileSync(emailTemplatePath, "utf8")

		const uploadsUrl = process.env.UPLOADS_URL
		let html = emailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl)

		// Partner bilgileri
		html = html.replace(/\{\{partner_name\}\}/g, managerUser.name_surname)

		// Müşteri bilgileri
		html = html.replace(/\{\{customer_name\}\}/g, customer.name_surname)
		html = html.replace(/\{\{customer_email\}\}/g, customer.email)
		html = html.replace(/\{\{customer_phone\}\}/g, customer.phone || "N/A")

		// Rezervasyon bilgileri
		html = html.replace(/\{\{reservation_id\}\}/g, reservationDetails.id || "")
		html = html.replace(/\{\{title\}\}/g, reservationDetails.tour_title || "")
		html = html.replace(/\{\{city\}\}/g, reservationDetails.tour_city || "")
		html = html.replace(/\{\{country\}\}/g, reservationDetails.tour_country || "")

// City varsa city+country section'ı göster, yoksa sadece country section'ı göster
		if (reservationDetails.tour_city && reservationDetails.tour_city.trim() !== "") {
			// City varsa: COUNTRY_ONLY_SECTION ve COUNTRY_LOCATION_SECTION'ı kaldır
			html = html.replace(/<!-- \{\{COUNTRY_ONLY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{COUNTRY_ONLY_SECTION_END\}\} -->/g, "")
			html = html.replace(/<!-- \{\{COUNTRY_LOCATION_SECTION_START\}\} -->[\s\S]*?<!-- \{\{COUNTRY_LOCATION_SECTION_END\}\} -->/g, "")
		} else {
			// City yoksa: CITY_SECTION ve LOCATION_SECTION'ı kaldır
			html = html.replace(/<!-- \{\{CITY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{CITY_SECTION_END\}\} -->/g, "")
			html = html.replace(/<!-- \{\{LOCATION_SECTION_START\}\} -->[\s\S]*?<!-- \{\{LOCATION_SECTION_END\}\} -->/g, "")
		}


		html = html.replace(/\{\{image\}\}/g, reservationDetails.tour_image ? `${uploadsUrl}${reservationDetails.tour_image}` : `${uploadsUrl}/uploads/no-file.png`)
		const formattedDate = reservationDetails.package_date
			? new Date(reservationDetails.package_date).toLocaleDateString(language === "en" ? "en-US" : "tr-TR", {
					year: "numeric",
					month: "long",
					day: "numeric",
			  })
			: ""

		html = html.replace(/\{\{date\}\}/g, formattedDate)

		// Saat bilgisi varsa
		if (reservationDetails.tour_hour) {
			const minute = reservationDetails.tour_minute || "00"
			html = html.replace(/\{\{hour\}\}/g, reservationDetails.tour_hour.toString())
			html = html.replace(/\{\{minute\}\}/g, minute.toString())
		} else {
			html = html.replace(/<!-- \{\{HOUR_SECTION_START\}\} -->[\s\S]*?<!-- \{\{HOUR_SECTION_END\}\} -->/g, "")
		}

		const guestsCount = reservationDetails.guests ? (Array.isArray(reservationDetails.guests) ? reservationDetails.guests.length : 1) : 1
		html = html.replace(/\{\{guests\}\}/g, guestsCount.toString())

		// Fiyat bilgileri
		const totalAmount = (reservationDetails.price).toFixed(2)

		html = html.replace(/\{\{total\}\}/g, totalAmount)
		html = html.replace(/\{\{currency\}\}/g, reservationDetails.currency_code || "USD")

		// Lokasyon section'ları kontrol et
		if (reservationDetails.tour_city) {
			html = html.replace(/<!-- \{\{COUNTRY_ONLY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{COUNTRY_ONLY_SECTION_END\}\} -->/g, "")
		} else {
			html = html.replace(/<!-- \{\{CITY_SECTION_START\}\} -->[\s\S]*?<!-- \{\{CITY_SECTION_END\}\} -->/g, "")
			html = html.replace(/<!-- \{\{LOCATION_SECTION_START\}\} -->[\s\S]*?<!-- \{\{LOCATION_SECTION_END\}\} -->/g, "")
		}

		// Email başlığı
		const emailSubject = language === "en"
			? "Timhoty - New Reservation Notification"
			: "Timhoty - Yeni Rezervasyon Bildiriminiz"

		await sendMail(managerUser.email, emailSubject, html)
		console.log("Partner notification email sent to:", managerUser.email)
	} catch (error) {
		console.error("Partner notification email error:", error)
	}
}

export default UserTourPayment
