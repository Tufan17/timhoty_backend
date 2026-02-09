import { FastifyRequest, FastifyReply } from "fastify"
import { viatorApiService } from "../../services/ViatorApi"
import knex from "@/db/knex"
import { translateCreate } from "@/helper/translate"
import CountryModel from "@/models/CountryModel"
import CurrencyModel from "@/models/CurrencyModel"

/**
 * Viator API Controller
 * Handles all Viator API related endpoints
 */
class ViatorController {
	/**
	 * Search products
	 * POST /api/v2/viator/products/search
	 */
	async searchProducts(req: FastifyRequest, res: FastifyReply) {
		try {
			const params = req.body as any

			const result = await viatorApiService.searchProducts(params)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Product search failed",
			})
		}
	}

	/**
	 * Search products WITH full details (batch processing)
	 * POST /api/v2/viator/products/search-with-details
	 * Basic-access friendly: uses /products/{code} in batches
	 */
	async searchProductsWithDetails(req: FastifyRequest, res: FastifyReply) {
		try {
			const body = (req.body || {}) as any
			const batchSize = body.batchSize || 10 // Rate limit koruması

			// Body'den batchSize'ı çıkar, search params'ına gönderme
			const { batchSize: _, ...searchParams } = body

			// 1. Search yap
			const searchResult = await viatorApiService.searchProducts(searchParams)

			// 2. Product code'ları çıkar
			const productCodes = searchResult.products?.map((p: any) => p.productCode) || []

			if (productCodes.length === 0) {
				return res.status(200).send({
					success: true,
					data: {
						products: [],
						totalCount: 0,
						summary: [],
					},
				})
			}

			// 3. Batch processing ile detayları al
			const detailedProducts = []
			for (let i = 0; i < productCodes.length; i += batchSize) {
				const batch = productCodes.slice(i, i + batchSize)

				console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(productCodes.length / batchSize)} (${batch.length} products)`)

				// Paralel istekler (batch içinde)
				const batchResults = await Promise.all(batch.map((code: string) => viatorApiService.getProduct(code).catch(err => null))) // Hata olursa null

				detailedProducts.push(...batchResults.filter(p => p !== null))
			}

			return res.status(200).send({
				success: true,
				data: {
					products: detailedProducts,
					totalCount: searchResult.totalCount,
					summary: searchResult.products, // Özet bilgi (search'ten)
				},
			})
		} catch (error: any) {
			console.error("Search with details error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Product search with details failed",
			})
		}
	}

	/**
	 * Test endpoint: Sync limited products with detailed logging
	 * GET /api/v2/viator/sync/products/test?limit=10
	 */
	async syncProductsTest(req: FastifyRequest, res: FastifyReply) {
		try {
			const { limit = 10 } = req.query as { limit?: number }

			console.log(`\n🚀 ===== VIATOR PRODUCT SYNC TEST (${limit} products) =====\n`)

			// 1. Search products
			const searchResult = await viatorApiService.searchProducts({
				pagination: { offset: 0, limit: Number(limit) },
				currency: "USD",
			})

			console.log(`✅ Found ${searchResult.products.length} products from search`)

			// 2. Get detailed info + availability for each product
			const detailedProducts = []
			for (let i = 0; i < searchResult.products.length; i++) {
				const product = searchResult.products[i]

				console.log(`\n📦 [${i + 1}/${searchResult.products.length}] Fetching details for: ${product.productCode}`)

				try {
					// 2a. Get product details
					const detail = await viatorApiService.getProduct(product.productCode)

					// 2b. Get availability schedule (pricing info)
					let availabilitySchedule = null
					try {
						const rawAvailability = await viatorApiService.getAvailabilitySchedule(product.productCode)

						// Filter bookableItems by current date
						const today = new Date().toISOString().split("T")[0]

						const filteredBookableItems = rawAvailability?.bookableItems
							?.map((item: any) => {
								// Filter seasons that include today's date
								const currentSeasons = item.seasons?.filter((season: any) => {
									const startDate = season.startDate

									// If endDate is not returned, season extends 384 days from startDate
									let endDate = season.endDate
									if (!endDate) {
										const start = new Date(startDate)
										start.setDate(start.getDate() + 384)
										endDate = start.toISOString().split("T")[0]
									}

									return startDate <= today && endDate >= today
								})

								if (currentSeasons && currentSeasons.length > 0) {
									return {
										...item,
										seasons: currentSeasons,
									}
								}
								return null
							})
							.filter(Boolean)

						// Find the cheapest bookableItem by ADULT price
						let cheapestItem: any = null
						let minPrice = Infinity

						for (const item of filteredBookableItems || []) {
							for (const season of item.seasons || []) {
								for (const record of season.pricingRecords || []) {
									for (const pricing of record.pricingDetails || []) {
										if (pricing.ageBand === "ADULT") {
											const price = pricing.price?.original?.recommendedRetailPrice || Infinity
											if (price < minPrice) {
												minPrice = price
												cheapestItem = item
											}
										}
									}
								}
							}
						}

						// Return only the cheapest bookableItem
						availabilitySchedule = cheapestItem
							? {
									bookableItem: cheapestItem,
									currency: rawAvailability?.currency,
									cheapestAdultPrice: minPrice,
								}
							: null

						console.log(`   📅 Availability: ${rawAvailability?.bookableItems?.length || 0} total options`)
						console.log(`   📅 Filtered (today=${today}): ${filteredBookableItems?.length || 0} active options`)
						console.log(`   💰 Cheapest: ${cheapestItem?.productOptionCode || "N/A"} @ ${minPrice !== Infinity ? minPrice : "N/A"} ${rawAvailability?.currency}`)
					} catch (availErr: any) {
						console.log(`   ⚠️ Availability not available: ${availErr.message}`)
					}

					// Combine detail + availability
					const fullProduct = {
						...detail,
						availabilitySchedule,
					}

					detailedProducts.push(fullProduct)

					// Console'a detaylı log
					console.log(`✅ Product Code: ${detail.productCode}`)
					console.log(`   Title: ${detail.title}`)
					console.log(`   Status: ${detail.status}`)
					console.log(`   Duration: ${JSON.stringify(detail.itinerary?.duration)}`)
					console.log(`   Images: ${detail.images?.length || 0} images`)
					console.log(`   Destinations: ${JSON.stringify(detail.destinations)}`)
					console.log(`   Tags: ${detail.tags?.length || 0} tags`)
					console.log(`   Reviews: ${detail.reviews?.totalReviews || 0} reviews (${detail.reviews?.combinedAverageRating || 0} avg)`)
					console.log(`   itineraryType: ${detail.itinerary?.itineraryType}`)
				} catch (err: any) {
					console.error(`❌ Failed to fetch ${product.productCode}: ${err.message}`)
				}
			}

			console.log(`\n✅ ===== SYNC TEST COMPLETE: ${detailedProducts.length}/${limit} products fetched =====\n`)

			// Detaylı response (mapping için analiz)
			return res.status(200).send({
				success: true,
				message: `Fetched ${detailedProducts.length} detailed products with availability. Check console for details.`,
				data: {
					totalFetched: detailedProducts.length,
					products: detailedProducts,
					sampleProduct: detailedProducts[0], // İlk ürün mapping için
				},
			})
		} catch (error: any) {
			console.error("Sync test error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Sync test failed",
			})
		}
	}

	/**
	 * Get product details by productCode
	 * Used by ActivityController to fetch Viator product details
	 */
	async getProductDetails(productCode: string) {
		try {
			// Get product details
			const detail = await viatorApiService.getProduct(productCode)

			// Get availability schedule (pricing info)
			let availabilitySchedule = null
			try {
				const rawAvailability = await viatorApiService.getAvailabilitySchedule(productCode)

				// Filter bookableItems by current date
				const today = new Date().toISOString().split("T")[0]

				const filteredBookableItems = rawAvailability?.bookableItems
					?.map((item: any) => {
						// Filter seasons that include today's date
						const currentSeasons = item.seasons?.filter((season: any) => {
							const startDate = season.startDate

							// If endDate is not returned, season extends 384 days from startDate
							let endDate = season.endDate
							if (!endDate) {
								const start = new Date(startDate)
								start.setDate(start.getDate() + 384)
								endDate = start.toISOString().split("T")[0]
							}

							return startDate <= today && endDate >= today
						})

						if (currentSeasons && currentSeasons.length > 0) {
							return {
								...item,
								seasons: currentSeasons,
							}
						}
						return null
					})
					.filter(Boolean)

				// Find the cheapest bookableItem by ADULT price
				let cheapestItem: any = null
				let minPrice = Infinity

				for (const item of filteredBookableItems || []) {
					for (const season of item.seasons || []) {
						for (const record of season.pricingRecords || []) {
							for (const pricing of record.pricingDetails || []) {
								if (pricing.ageBand === "ADULT") {
									const price = pricing.price?.original?.recommendedRetailPrice || Infinity
									if (price < minPrice) {
										minPrice = price
										cheapestItem = item
									}
								}
							}
						}
					}
				}

				// Return only the cheapest bookableItem
				availabilitySchedule = cheapestItem
					? {
							bookableItem: cheapestItem,
							currency: rawAvailability?.currency,
							cheapestAdultPrice: minPrice,
						}
					: null
			} catch (availErr: any) {
				console.log(`⚠️ Availability not available: ${availErr.message}`)
			}

			// Combine detail + availability
			return {
				...detail,
				availabilitySchedule,
			}
		} catch (error: any) {
			console.error(`Failed to fetch product details for ${productCode}:`, error.message)
			throw error
		}
	}

	/**
	 * Get modified products
	 * GET /api/v2/viator/products/modified
	 */
	async getModifiedProducts(req: FastifyRequest, res: FastifyReply) {
		try {
			const { count } = req.query as { count?: string }

			const result = await viatorApiService.getModifiedProducts(count ? parseInt(count) : 5)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get modified products failed",
			})
		}
	}

	/**
	 * Get product details
	 * GET /api/v2/viator/products/:productCode
	 */
	async getProduct(req: FastifyRequest, res: FastifyReply) {
		try {
			const { productCode } = req.params as { productCode: string }

			const result = await viatorApiService.getProduct(productCode)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get product failed",
			})
		}
	}

	/**
	 * Get multiple products
	 * POST /api/v2/viator/products/bulk
	 */
	async getProducts(req: FastifyRequest, res: FastifyReply) {
		try {
			const { productCodes } = req.body as { productCodes: string[] }

			if (!productCodes || !Array.isArray(productCodes)) {
				return res.status(400).send({
					success: false,
					message: "productCodes array is required",
				})
			}

			const result = await viatorApiService.getProducts(productCodes)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get products failed",
			})
		}
	}

	/**
	 * Check availability
	 * POST /api/v2/viator/availability/check
	 */
	async checkAvailability(req: FastifyRequest, res: FastifyReply) {
		try {
			const params = req.body as any

			const result = await viatorApiService.checkAvailability(params)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Check availability failed",
			})
		}
	}

	/**
	 * Get availability schedule
	 * GET /api/v2/viator/availability/schedule/:productCode
	 */
	async getAvailabilitySchedule(req: FastifyRequest, res: FastifyReply) {
		try {
			const { productCode } = req.params as { productCode: string }

			const result = await viatorApiService.getAvailabilitySchedule(productCode)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get availability schedule failed",
			})
		}
	}

	/**
	 * Get all destinations
	 * GET /api/v2/viator/destinations
	 */
	async getDestinations(req: FastifyRequest, res: FastifyReply) {
		try {
			const result = await viatorApiService.getDestinations()

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get destinations failed",
			})
		}
	}

	/**
	 * Get all product tags (parent tags only)
	 * GET /api/v2/viator/tags
	 */
	async getTags(req: FastifyRequest, res: FastifyReply) {
		try {
			const result = await viatorApiService.getTags()
			const allTags = result.tags || []

			// Filter: Sadece parent tag'lar (parentTagIds olmayanlar)
			const parentTags = allTags.filter((tag: any) => !tag.parentTagIds || tag.parentTagIds.length === 0)

			console.log(`✅ Total tags: ${allTags.length}`)
			console.log(`🎯 Parent tags (filtered): ${parentTags.length}`)

			return res.status(200).send({
				success: true,
				data: {
					totalTags: allTags.length,
					parentTags: parentTags.length,
					tags: parentTags,
				},
			})
		} catch (error: any) {
			console.error("Get tags error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Get tags failed",
			})
		}
	}

	/**
	 * Get only countries and sync to database
	 * GET /api/v2/viator/destinations/countries
	 */
	async getCountries(req: FastifyRequest, res: FastifyReply) {
		try {
			const result = await viatorApiService.getDestinations()

			// Performanslı filtreleme - sadece COUNTRY tipindekiler
			const countries = []
			for (let i = 0; i < result.destinations.length; i++) {
				if (result.destinations[i].type === "COUNTRY") {
					countries.push(result.destinations[i])
				}
			}

			// Her country için DB'ye kaydet
			for (const country of countries) {
				try {
					// 1. Duplicate check - destinationId'ye göre kontrol
					const existingCountry = await new CountryModel().first({
						destination_id: country.destinationId,
					})

					if (existingCountry) {
						continue // Zaten var, skip
					}

					// 2. Currency ID bul (defaultCurrencyCode → currencies.code)
					let currencyId = null
					if (country.defaultCurrencyCode) {
						const currency = await new CurrencyModel().first({
							code: country.defaultCurrencyCode,
						})

						if (currency) {
							currencyId = currency.id
						}
					}

					// 3. Phone code temizle ve validate
					let phoneCode = "X" // Default
					if (country.countryCallingCode) {
						// Sadece rakamları al (+ ve - işaretlerini kaldır)
						const digitsOnly = country.countryCallingCode.replace(/\D/g, "")
						// İlk 5 karakteri al
						phoneCode = digitsOnly.substring(0, 5) || "X"
					}

					// 4. Timezone validate
					const timezone = country.timeZone || "X"

					// 5. Countries tablosuna insert
					const newCountry = await new CountryModel().create({
						destination_id: country.destinationId,
						phone_code: phoneCode,
						timezone: timezone,
						flag: null, // Flag yok API'de
						code: "X", // Default code
						currency_id: currencyId,
					})

					// 5. Country pivots oluştur (EN + TR)
					await translateCreate({
						target: "country_pivots",
						target_id_key: "country_id",
						target_id: newCountry.id,
						language_code: "en", // API'den EN geliyor
						data: {
							name: country.name,
						},
					})
				} catch (error: any) {
					console.error(`Country sync error for ${country.name}:`, error.message)
				}
			}

			return res.status(200).send({
				success: true,
				message: "Countries synced successfully",
				data: {
					total: countries.length,
				},
			})
		} catch (error: any) {
			console.error("Countries sync error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Get countries failed",
			})
		}
	}

	/**
	 * Get destination by ref (destinationId)
	 * GET /api/v2/viator/destinations/:ref
	 * Returns single destination with parent chain (state, country)
	 */
	async getDestinationByRef(req: FastifyRequest, res: FastifyReply) {
		try {
			const { ref } = req.params as { ref: string }

			if (!ref || ref.trim() === "") {
				return res.status(400).send({
					success: false,
					message: "ref parametresi gerekli (örn: 671)",
				})
			}

			// Tüm destinasyonları çek
			const data = await viatorApiService.getDestinations()
			const list = data.destinations || []

			// destinationId'ye göre map oluştur
			const byId: Record<string, any> = {}
			for (const d of list) {
				byId[String(d.destinationId)] = d
			}

			// ref ile destination bul
			const dest = list.find((d: any) => String(d.destinationId) === ref)

			if (!dest) {
				return res.status(404).send({
					success: false,
					message: `Destinasyon bulunamadı: ${ref}`,
				})
			}

			// Parent zincirini takip et (ülke/eyalet bilgisi için)
			const parentChain = []
			let parentId = dest.parentDestinationId

			while (parentId != null && byId[String(parentId)]) {
				const parent = byId[String(parentId)]
				parentChain.push({
					destinationId: parent.destinationId,
					name: parent.name,
					type: parent.type,
				})
				parentId = parent.parentDestinationId
			}

			// Country'yi parent chain'den bul
			const country = parentChain.find((p: any) => p.type === "COUNTRY") || null

			return res.status(200).send({
				success: true,
				destination: dest,
				country: country ? country.name : null,
				parentChain,
			})
		} catch (error: any) {
			console.error("Get destination by ref error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Get destination by ref failed",
			})
		}
	}

	/**
	 * Sync countries to database (manual trigger for testing)
	 * GET /api/v2/viator/destinations/countries/sync
	 */
	async getCountriesSync(req: FastifyRequest, res: FastifyReply) {
		try {
			const { getCountries } = await import("../../crone/viatur/country")
			const result = await getCountries()

			return res.status(200).send(result)
		} catch (error: any) {
			console.error("Countries sync error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Countries sync failed",
			})
		}
	}

	/**
	 * Sync cities to database (manual trigger for testing)
	 * GET /api/v2/viator/destinations/cities/sync
	 */
	async getCitiesSync(req: FastifyRequest, res: FastifyReply) {
		try {
			const { getCities } = await import("../../crone/viatur/city")
			const result = await getCities()

			return res.status(200).send(result)
		} catch (error: any) {
			console.error("Cities sync error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Cities sync failed",
			})
		}
	}

	/**
	 * Sync tags to database (manual trigger for testing)
	 * GET /api/v2/viator/tags/sync
	 */
	async getTagsSync(req: FastifyRequest, res: FastifyReply) {
		try {
			const { getTags } = await import("../../crone/viatur/tag")
			const result = await getTags()

			return res.status(200).send(result)
		} catch (error: any) {
			console.error("Tags sync error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Tags sync failed",
			})
		}
	}

	/**
	 * Sync products to database (manual trigger for testing)
	 * GET /api/v2/viator/sync/products
	 */
	async syncProducts(req: FastifyRequest, res: FastifyReply) {
		try {
			const { syncProducts } = await import("../../crone/viatur/product-sync")
			const result = await syncProducts()

			return res.status(200).send(result)
		} catch (error: any) {
			console.error("Products sync error:", error)
			return res.status(500).send({
				success: false,
				message: error.message || "Products sync failed",
			})
		}
	}

	/**
	 * Get product reviews
	 * POST /api/v2/viator/reviews/:productCode
	 */
	async getProductReviews(req: FastifyRequest, res: FastifyReply) {
		try {
			const { productCode } = req.params as { productCode: string }
			const params = req.body as any

			const result = await viatorApiService.getProductReviews(productCode, params)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get product reviews failed",
			})
		}
	}

	/**
	 * Hold booking
	 * POST /api/v2/viator/bookings/hold
	 */
	async holdBooking(req: FastifyRequest, res: FastifyReply) {
		try {
			const bookingData = req.body as any

			const result = await viatorApiService.holdBooking(bookingData)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Hold booking failed",
			})
		}
	}

	/**
	 * Confirm booking
	 * POST /api/v2/viator/bookings/confirm
	 */
	async confirmBooking(req: FastifyRequest, res: FastifyReply) {
		try {
			const bookingData = req.body as any

			const result = await viatorApiService.confirmBooking(bookingData)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Confirm booking failed",
			})
		}
	}

	/**
	 * Get booking status
	 * GET /api/v2/viator/bookings/:bookingReference/status
	 */
	async getBookingStatus(req: FastifyRequest, res: FastifyReply) {
		try {
			const { bookingReference } = req.params as { bookingReference: string }

			const result = await viatorApiService.getBookingStatus(bookingReference)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Get booking status failed",
			})
		}
	}

	/**
	 * Cancel booking
	 * POST /api/v2/viator/bookings/:bookingReference/cancel
	 */
	async cancelBooking(req: FastifyRequest, res: FastifyReply) {
		try {
			const { bookingReference } = req.params as { bookingReference: string }
			const cancelData = req.body as any

			const result = await viatorApiService.cancelBooking(bookingReference, cancelData)

			return res.status(200).send({
				success: true,
				data: result,
			})
		} catch (error: any) {
			return res.status(500).send({
				success: false,
				message: error.message || "Cancel booking failed",
			})
		}
	}
}

export default new ViatorController()
