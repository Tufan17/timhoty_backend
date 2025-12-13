import axios, { AxiosInstance } from "axios"

// Tap Payments Service Configuration
interface TapPaymentConfig {
	secretKey: string
	baseURL: string
	isTestMode: boolean
}

// Payment Request Interfaces
interface CreateChargeRequest {
	amount: number
	currency: string
	customer: {
		first_name: string
		last_name: string
		email: string
		phone?: {
			country_code: string
			number: string
		}
	}
	merchant?: {
		id: string
	}
	source?: {
		id: string
	}
	redirect?: {
		url: string
	}
	post?: {
		url: string
	}
	description?: string
	metadata?: Record<string, any>
	transaction?: {
		url: string
	}
}

interface CreateChargeResponse {
	id: string
	status: string
	amount: number
	currency: string
	redirect: {
		url: string
	}
	receipt: {
		id: string
		email: boolean
		sms: boolean
	}
	customer: {
		id: string
		first_name: string
		last_name: string
		email: string
	}
	merchant: {
		id: string
	}
	source: {
		id: string
		object: string
		type: string
	}
	created: number
	url: string
	transaction: {
		url: string
	}
}

interface RefundRequest {
	charge_id: string
	amount?: number
	reason?: string
	description?: string
	metadata?: Record<string, any>
}

interface RefundResponse {
	id: string
	status: string
	amount: number
	currency: string
	charge_id: string
	created: number
	receipt: {
		id: string
		email: boolean
		sms: boolean
	}
}

class TapPaymentsService {
	private client: AxiosInstance
	private config: TapPaymentConfig

	constructor() {
		this.config = {
			secretKey: process.env.TAP_PAYMENTS_SECRET_KEY || "",
			baseURL: process.env.TAP_PAYMENTS_BASE_URL || "https://api.tap.company/v2",
			isTestMode: process.env.NODE_ENV !== "production",
		}

		this.client = axios.create({
			baseURL: this.config.baseURL,
			headers: {
				Authorization: `Bearer ${this.config.secretKey}`,
				"Content-Type": "application/json",
				Accept: "application/json",
				lang_code: "en",
			},
		})
	}

	/**
	 * Create a payment charge
	 */
	async createCharge(request: CreateChargeRequest): Promise<CreateChargeResponse> {
		try {
			// Tap Payments API formatına uygun request oluştur
			const tapRequest = {
				amount: request.amount,
				currency: request.currency,
				customer: {
					first_name: request.customer.first_name,
					last_name: request.customer.last_name,
					email: request.customer.email,
					phone: request.customer.phone,
				},
				source: request.source || {
					id: "src_all", // Tüm ödeme yöntemlerini kabul et
				},
				description: request.description,
				redirect: request.redirect,
				post: request.post,
				metadata: request.metadata,
			}

			const response = await this.client.post("/charges", tapRequest)
			return response.data
		} catch (error: any) {
			// Debug log (can be removed in production)
			console.error("Tap Payments Error:", {
				status: error.response?.status,
				message: error.response?.data?.errors?.[0]?.description || error.message,
			})
			throw new Error(`Tap Payments Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Retrieve a charge by ID
	 */
	async getCharge(chargeId: string): Promise<CreateChargeResponse> {
		try {
			const response = await this.client.get(`/charges/${chargeId}`)
			return response.data
		} catch (error: any) {
			throw new Error(`Tap Payments Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Create a refund
	 */
	async createRefund(request: RefundRequest): Promise<RefundResponse> {
		try {
			const response = await this.client.post("/refunds", request)
			return response.data
		} catch (error: any) {
			throw new Error(`Tap Payments Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Retrieve a refund by ID
	 */
	async getRefund(refundId: string): Promise<RefundResponse> {
		try {
			const response = await this.client.get(`/refunds/${refundId}`)
			return response.data
		} catch (error: any) {
			throw new Error(`Tap Payments Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * List charges with pagination
	 */
	async listCharges(limit: number = 25, startingAfter?: string): Promise<any> {
		try {
			const params: any = { limit }
			if (startingAfter) {
				params.starting_after = startingAfter
			}

			const response = await this.client.get("/charges", { params })
			return response.data
		} catch (error: any) {
			throw new Error(`Tap Payments Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Verify webhook signature
	 */
	verifyWebhookSignature(payload: string, signature: string): boolean {
		// Implementation depends on Tap Payments webhook verification method
		// This is a placeholder - you'll need to implement based on their documentation
		return true
	}

	/**
	 * Create payment intent (legacy method for backward compatibility)
	 */
	async createPaymentIntent(amount: number, currency: string = "USD"): Promise<any> {
		const chargeRequest: CreateChargeRequest = {
			amount: amount * 100, // Convert to smallest currency unit
			currency: currency,
			customer: {
				first_name: "Guest",
				last_name: "User",
				email: "guest@example.com",
			},
			description: `Payment for ${amount} ${currency}`,
		}

		return await this.createCharge(chargeRequest)
	}
}

// Export singleton instance
export const tapPaymentsService = new TapPaymentsService()

// Export individual methods for backward compatibility
export const createPaymentIntent = tapPaymentsService.createPaymentIntent.bind(tapPaymentsService)
export const createCharge = tapPaymentsService.createCharge.bind(tapPaymentsService)
export const getCharge = tapPaymentsService.getCharge.bind(tapPaymentsService)
export const createRefund = tapPaymentsService.createRefund.bind(tapPaymentsService)
export const getRefund = tapPaymentsService.getRefund.bind(tapPaymentsService)
export const listCharges = tapPaymentsService.listCharges.bind(tapPaymentsService)

export default tapPaymentsService
