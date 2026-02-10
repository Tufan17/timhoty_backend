import axios, { AxiosInstance } from "axios"

// Viator API Service Configuration
interface ViatorApiConfig {
	apiKey: string
	baseURL: string
	timeout: number
}

// Request/Response Interfaces (Şimdilik basit tutuyoruz)
interface SearchProductsParams {
	pagination?: {
		offset?: number
		start?: number
		limit?: number
		count?: number
	}
	sorting?: {
		sort?: string
		order?: string
	}
	filtering?: {
		destination?: string
		[key: string]: any
	}
	currency?: string
	defaultDestination?: string
}

interface ProductSearchResponse {
	products: any[]
	pagination: any
	totalCount?: number
}

class ViatorApiService {
	private client: AxiosInstance
	private config: ViatorApiConfig
	private static readonly MAX_COUNT_PER_REQUEST = 50

	constructor() {
		this.config = {
			apiKey: process.env.VIATOR_API_KEY || "",
			baseURL: process.env.VIATOR_BASE_URL || "https://api.sandbox.viator.com",
			timeout: 0, // No timeout - unlimited for sync operations
		}

		this.client = axios.create({
			baseURL: this.config.baseURL,
			timeout: this.config.timeout,
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json;version=2.0",
				"Accept-Language": "en-US",
				"exp-api-key": this.config.apiKey,
			},
		})
	}

	/**
	 * Search products with pagination and filtering
	 * Includes retry logic for transient errors
	 */
	async searchProducts(params: SearchProductsParams = {}): Promise<ProductSearchResponse> {
		const MAX_RETRIES = 3
		const RETRY_DELAY = 2000 // 2 seconds

		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				const pagination = params.pagination || {}
				const start = pagination.offset !== undefined ? pagination.offset + 1 : (pagination.start ?? 1)
				const count = Math.min(pagination.limit ?? pagination.count ?? ViatorApiService.MAX_COUNT_PER_REQUEST, ViatorApiService.MAX_COUNT_PER_REQUEST)

				const sorting = params.sorting || {}
				const order = (sorting.order || "DESC").toUpperCase() === "DESC" ? "DESCENDING" : "ASCENDING"

				const filtering = { ...(params.filtering || {}) }
				if (!filtering.destination) {
					filtering.destination = params.defaultDestination || "77"
				}

				const body = {
					filtering,
					sorting: {
						sort: sorting.sort || "TRAVELER_RATING",
						order,
					},
					pagination: { start, count },
					currency: params.currency || "USD",
				}

				const response = await this.client.post("/products/search", body)
				return response.data
			} catch (error: any) {
				const status = error.response?.status
				const isRetryable = status === 500 || status === 502 || status === 503 || status === 504 || error.code === "ECONNABORTED"

				if (isRetryable && attempt < MAX_RETRIES) {
					console.log(`⚠️ Viator API error (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY}ms...`)
					await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt)) // Exponential backoff
					continue
				}

				console.error("❌ Viator API - Product search error:", {
					message: error.message,
					status: status,
					data: error.response?.data,
				})
				throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
			}
		}

		throw new Error("Viator API Error: Max retries exceeded")
	}

	/**
	 * Get modified products since a specific date
	 */
	async getModifiedProducts(count: number = 5): Promise<any> {
		try {
			const response = await this.client.get(`/products/modified-since?count=${count}`)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get modified products error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get product details by product code
	 */
	async getProduct(productCode: string): Promise<any> {
		try {
			const response = await this.client.get(`/products/${productCode}`)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get product error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get multiple products by product codes
	 */
	async getProducts(productCodes: string[]): Promise<any> {
		try {
			const response = await this.client.post("/products/bulk", {
				productCodes: productCodes,
			})
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get products bulk error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Check availability for a product
	 */
	async checkAvailability(params: any): Promise<any> {
		try {
			const response = await this.client.post("/availability/check", params)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Check availability error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get availability schedule for a product
	 */
	async getAvailabilitySchedule(productCode: string): Promise<any> {
		try {
			const response = await this.client.get(`/availability/schedules/${productCode}`)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get availability schedule error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Hold a booking
	 */
	async holdBooking(bookingData: any): Promise<any> {
		try {
			const response = await this.client.post("/bookings/hold", bookingData)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Hold booking error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Confirm a booking
	 */
	async confirmBooking(bookingData: any): Promise<any> {
		try {
			const response = await this.client.post("/bookings/book", bookingData)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Confirm booking error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get booking status
	 */
	async getBookingStatus(bookingReference: string): Promise<any> {
		try {
			const response = await this.client.get("/bookings/status", {
				params: { bookingRef: bookingReference },
			})
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get booking status error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Cancel a booking
	 */
	async cancelBooking(bookingReference: string, cancelData: any): Promise<any> {
		try {
			const response = await this.client.post(`/bookings/${bookingReference}/cancel`, cancelData)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Cancel booking error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get cancel quote
	 */
	async getCancelQuote(bookingReference: string): Promise<any> {
		try {
			const response = await this.client.get(`/bookings/${bookingReference}/cancel-quote`)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get cancel quote error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Hold cart booking
	 */
	async holdCartBooking(cartData: any): Promise<any> {
		try {
			const response = await this.client.post("/bookings/cart/hold", cartData)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Hold cart booking error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Confirm cart booking
	 */
	async confirmCartBooking(cartData: any): Promise<any> {
		try {
			const response = await this.client.post("/bookings/cart/book", cartData)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Confirm cart booking error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Search attractions
	 */
	async searchAttractions(params: any): Promise<any> {
		try {
			const response = await this.client.post("/attractions/search", params)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Search attractions error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get attraction details
	 */
	async getAttraction(attractionId: string): Promise<any> {
		try {
			const response = await this.client.get(`/attractions/${attractionId}`)
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get attraction error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get exchange rates
	 */
	async getExchangeRates(currencies: string[]): Promise<any> {
		try {
			const response = await this.client.get("/exchange-rates", {
				params: { currencies: currencies.join(",") },
			})
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get exchange rates error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get product reviews
	 */
	async getProductReviews(productCode: string, params: any = {}): Promise<any> {
		try {
			const pagination = params.pagination || {}
			const start = pagination.offset !== undefined ? pagination.offset + 1 : (pagination.start ?? 1)
			const count = pagination.limit ?? pagination.count ?? 10

			const response = await this.client.post("/reviews/product", {
				productCode,
				provider: params.provider || "ALL",
				count,
				start,
				showMachineTranslated: params.showMachineTranslated !== false,
				reviewsForNonPrimaryLocale: params.reviewsForNonPrimaryLocale !== false,
				sortBy: params.sortBy || "MOST_RECENT_PER_LOCALE",
			})
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get product reviews error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get bulk location details
	 */
	async getBulkLocations(locationRefs: string | string[]): Promise<any> {
		try {
			const refs = Array.isArray(locationRefs) ? locationRefs : [locationRefs]
			const response = await this.client.post("/locations/bulk", {
				locations: refs,
			})
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get bulk locations error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get all destinations
	 */
	async getDestinations(): Promise<any> {
		try {
			const response = await this.client.get("/destinations")
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get destinations error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}

	/**
	 * Get all product tags (all languages)
	 */
	async getTags(): Promise<any> {
		try {
			const response = await this.client.get("/products/tags")
			return response.data
		} catch (error: any) {
			console.error("Viator API - Get tags error:", error.message)
			throw new Error(`Viator API Error: ${error.response?.data?.message || error.message}`)
		}
	}
}

// Export singleton instance
export const viatorApiService = new ViatorApiService()

// Export individual methods for convenience
export const searchProducts = viatorApiService.searchProducts.bind(viatorApiService)
export const getModifiedProducts = viatorApiService.getModifiedProducts.bind(viatorApiService)
export const getProduct = viatorApiService.getProduct.bind(viatorApiService)
export const getProducts = viatorApiService.getProducts.bind(viatorApiService)
export const checkAvailability = viatorApiService.checkAvailability.bind(viatorApiService)
export const getAvailabilitySchedule = viatorApiService.getAvailabilitySchedule.bind(viatorApiService)
export const holdBooking = viatorApiService.holdBooking.bind(viatorApiService)
export const confirmBooking = viatorApiService.confirmBooking.bind(viatorApiService)
export const getBookingStatus = viatorApiService.getBookingStatus.bind(viatorApiService)
export const cancelBooking = viatorApiService.cancelBooking.bind(viatorApiService)
export const getCancelQuote = viatorApiService.getCancelQuote.bind(viatorApiService)
export const holdCartBooking = viatorApiService.holdCartBooking.bind(viatorApiService)
export const confirmCartBooking = viatorApiService.confirmCartBooking.bind(viatorApiService)
export const searchAttractions = viatorApiService.searchAttractions.bind(viatorApiService)
export const getAttraction = viatorApiService.getAttraction.bind(viatorApiService)
export const getExchangeRates = viatorApiService.getExchangeRates.bind(viatorApiService)
export const getProductReviews = viatorApiService.getProductReviews.bind(viatorApiService)
export const getBulkLocations = viatorApiService.getBulkLocations.bind(viatorApiService)
export const getDestinations = viatorApiService.getDestinations.bind(viatorApiService)
export const getTags = viatorApiService.getTags.bind(viatorApiService)

export default viatorApiService
