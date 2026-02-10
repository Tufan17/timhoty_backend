import { viatorApiService } from "@/services/ViatorApi"
import ActivityModel from "@/models/ActivityModel"
import CityModel from "@/models/CityModel"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import ActivityGalleryModel from "@/models/ActivityGalleryModel"
import ActivityGalleryPivotModel from "@/models/ActivityGalleryPivot"
import ActivityPackageModel from "@/models/ActivityPackageModel"
import ActivityPackagePriceModel from "@/models/ActivityPackagePriceModel"
import ActivityPackageImageModel from "@/models/ActivityPackageImageModel"
import CurrencyModel from "@/models/CurrencyModel"
import { translateCreate } from "@/helper/translate"
import knex from "@/db/knex"

/**
 * Sync ALL products from Viator API to database
 * Uses pagination to fetch all products (31k+)
 */
export async function syncProducts() {
	try {
		console.log(`\n🚀 ===== VIATOR FULL PRODUCT SYNC STARTED =====\n`)

		// Configuration
		const PAGE_SIZE = 50 // Products per page (Viator max is typically 50-100)
		const BATCH_SIZE = 5 // Sequential product detail requests per batch
		const DELAY_BETWEEN_BATCHES = 500 // ms delay between batches (rate limiting)

		// 1. First, get total count
		const initialSearch = await viatorApiService.searchProducts({
			pagination: { offset: 0, limit: 1 },
			currency: "USD",
		})

		const totalCount = initialSearch.totalCount || 0
		console.log(`📊 Total products in Viator: ${totalCount}`)

		if (totalCount === 0) {
			return {
				success: true,
				message: "No products found in Viator",
				data: { total: 0, synced: 0, skipped: 0 },
			}
		}

		// 2. Paginate through all products
		let syncedCount = 0
		let skippedCount = 0
		let errorCount = 0
		let offset = 0

		while (offset < totalCount) {
			console.log(`\n📄 ===== PAGE ${Math.floor(offset / PAGE_SIZE) + 1}/${Math.ceil(totalCount / PAGE_SIZE)} (offset: ${offset}) =====`)

			// Fetch page of product codes
			const searchResult = await viatorApiService.searchProducts({
				pagination: { offset, limit: PAGE_SIZE },
				currency: "USD",
			})

			const productCodes = searchResult.products?.map((p: any) => p.productCode) || []
			console.log(`   📦 Fetched ${productCodes.length} product codes`)

			if (productCodes.length === 0) {
				console.log(`   ⚠️ No more products, ending pagination`)
				break
			}

			// Process products in batches (rate limiting)
			for (let batchStart = 0; batchStart < productCodes.length; batchStart += BATCH_SIZE) {
				const batch = productCodes.slice(batchStart, batchStart + BATCH_SIZE)
				console.log(`\n   🔄 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(productCodes.length / BATCH_SIZE)} (${batch.length} products)`)

				// Process batch sequentially (to avoid overwhelming API)
				for (const productCode of batch) {
					const result = await syncSingleProduct(productCode)
					if (result === "synced") syncedCount++
					else if (result === "skipped") skippedCount++
					else errorCount++
				}

				// Delay between batches
				if (batchStart + BATCH_SIZE < productCodes.length) {
					await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
				}
			}

			// Move to next page
			offset += PAGE_SIZE

			// Progress log
			const progress = Math.min(100, Math.round((offset / totalCount) * 100))
			console.log(`\n📊 Progress: ${progress}% | Synced: ${syncedCount} | Skipped: ${skippedCount} | Errors: ${errorCount}`)
		}

		console.log(`\n✅ ===== VIATOR FULL PRODUCT SYNC COMPLETE =====`)
		console.log(`   Total processed: ${syncedCount + skippedCount + errorCount}`)
		console.log(`   Synced: ${syncedCount}`)
		console.log(`   Skipped: ${skippedCount}`)
		console.log(`   Errors: ${errorCount}`)

		return {
			success: true,
			message: "Products synced successfully",
			data: {
				total: totalCount,
				synced: syncedCount,
				skipped: skippedCount,
				errors: errorCount,
			},
		}
	} catch (error: any) {
		console.error("Product sync error:", error)
		return {
			success: false,
			message: error.message || "Product sync failed",
		}
	}
}

/**
 * Sync a single product from Viator to database
 * Returns: "synced" | "skipped" | "error"
 */
async function syncSingleProduct(productCode: string): Promise<"synced" | "skipped" | "error"> {
	try {
		console.log(`      📦 Processing: ${productCode}`)

		// 1. Get product details
		const product = await viatorApiService.getProduct(productCode)

		// 2. Get availability schedule (pricing info)
		let availabilitySchedule: any = null
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

			// Find the cheapest bookableItem (by ADULT price)
			let cheapestItem = null
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
			// Availability not available - continue without it
		}

		// 3. Filter by itinerary type (STANDARD or ACTIVITY only)
		if (product.itinerary?.itineraryType !== "STANDARD" && product.itinerary?.itineraryType !== "ACTIVITY") {
			console.log(`         ⏭️  Skipped: itineraryType is ${product.itinerary?.itineraryType}`)
			return "skipped"
		}

		// 4. Duplicate check - productCode'a göre kontrol
		const existing = await new ActivityModel().first({
			product_code: product.productCode,
		})

		if (existing) {
			console.log(`         ⏭️  Skipped: Already exists`)
			return "skipped"
		}

		// 5. Find city by destination ref
		let cityId = null
		if (product.destinations && product.destinations.length > 0) {
			const primaryDestination = product.destinations.find((d: any) => d.primary) || product.destinations[0]
			const city = await new CityModel().first({
				destination_id: primaryDestination.ref,
			})

			if (city) {
				cityId = city.id
			} else {
				console.log(`         ⏭️  Skipped: City not found for destination ${primaryDestination.ref}`)
				return "skipped"
			}
		}

		// 6. Match tags to activity_type (find first matching tag)
		let activityTypeId = null
		if (product.tags && product.tags.length > 0) {
			// Loop through all tags and find the first one that exists in activity_types
			for (const tagId of product.tags) {
				const activityType = await new ActivityTypeModel().first({
					tag_id: tagId,
				})

				if (activityType) {
					activityTypeId = activityType.id
					break
				}
			}
		}

		// 7. Extract duration from itinerary
		let duration: string | null = null
		if (product.itinerary?.duration) {
			const dur = product.itinerary.duration

			// Priority 1: Fixed duration
			if (dur.fixedDurationInMinutes) {
				duration = String(dur.fixedDurationInMinutes)
			}
			// Priority 2: Variable duration (range)
			else if (dur.variableDurationFromMinutes && dur.variableDurationToMinutes) {
				duration = `${dur.variableDurationFromMinutes}-${dur.variableDurationToMinutes}`
			}
			// Priority 3: Unstructured duration (string)
			else if (dur.unstructuredDuration) {
				duration = dur.unstructuredDuration
			}
		}

		// 8. Extract additional info for activity_info
		let activityInfo = ""
		if (product.additionalInfo && product.additionalInfo.length > 0) {
			activityInfo = product.additionalInfo.map((info: any) => info.description).join("\n\n")
		}

		// 9. Extract refund policy
		const refundPolicy = product.cancellationPolicy?.description || ""

		// 10. Create activity, pivot and images in transaction
		await knex.transaction(async trx => {
			// 10a. Create activity
			const newActivity = await new ActivityModel().create(
				{
					location_id: cityId,
					solution_partner_id: null,
					status: true,
					admin_approval: true,
					activity_type_id: activityTypeId,
					product_code: product.productCode,
					type: "viator",
					duration: duration,
					map_location: null,
					approval_period: null,
					comment_count: 0,
					average_rating: product.reviews?.combinedAverageRating || 0,
				},
				trx,
			)

			// 11. Create activity pivot with translateCreate (auto-translates to all languages)
			await translateCreate({
				target: "activity_pivots",
				target_id_key: "activity_id",
				target_id: newActivity.id,
				language_code: "en",
				data: {
					title: product.title || "Untitled",
					general_info: product.description || "",
					activity_info: activityInfo,
					refund_policy: refundPolicy,
				},
				trx,
			})

			// 12. Sync images to activity_galleries
			if (product.images && product.images.length > 0) {
				for (let imgIndex = 0; imgIndex < product.images.length; imgIndex++) {
					const image = product.images[imgIndex]

					// Find the 720x480 variant (largest standard size)
					const variant = image.variants?.find((v: any) => v.width === 720 && v.height === 480) || image.variants?.[0]

					if (variant?.url) {
						// Create gallery entry
						const gallery = await new ActivityGalleryModel().create(
							{
								activity_id: newActivity.id,
								image_url: variant.url,
								image_type: "image",
							},
							trx,
						)

						// Create gallery pivot with category (first = "Kapak Resmi", others = "Aktivite")
						const category = imgIndex === 0 ? "Kapak Resmi" : "Aktivite"
						await new ActivityGalleryPivotModel().create(
							{
								activity_gallery_id: gallery.id,
								category: category,
								language_code: "tr",
							},
							trx,
						)
					}
				}
			}

			// 13. Create activity_package from availabilitySchedule
			if (availabilitySchedule?.bookableItem) {
				const bookableItem = availabilitySchedule.bookableItem

				// Get the first season for start_date and end_date
				const season = bookableItem.seasons?.[0]
				if (season) {
					// Calculate endDate if not provided (384 days from startDate)
					let endDate = season.endDate
					if (!endDate) {
						const start = new Date(season.startDate)
						start.setDate(start.getDate() + 384)
						endDate = start.toISOString().split("T")[0]
					}

					// Create activity_package
					const newPackage = await new ActivityPackageModel().create(
						{
							activity_id: newActivity.id,
							return_acceptance_period: 0,
							discount: 0,
							constant_price: true,
							total_tax_amount: 0,
							start_date: season.startDate,
							end_date: endDate,
						},
						trx,
					)

					// Create activity_package_pivot with translateCreate (auto-translates to all languages)
					const packageName = bookableItem.productOptionCode || "Default Package"

					await translateCreate({
						target: "activity_package_pivots",
						target_id_key: "activity_package_id",
						target_id: newPackage.id,
						language_code: "en",
						data: {
							name: packageName,
							description: "",
							refund_policy: refundPolicy,
						},
						trx,
					})

					// 14. Create activity_package_price
					// Find currency by code
					const currencyCode = availabilitySchedule.currency
					const currency = await new CurrencyModel().first({ code: currencyCode })

					if (currency) {
						// Get pricing from pricingRecords
						const pricingRecord = season.pricingRecords?.[0]
						const pricingDetails = pricingRecord?.pricingDetails || []

						let mainPrice = 0
						let childPrice = null

						// Check pricingPackageType
						const firstPricing = pricingDetails[0]
						if (firstPricing?.pricingPackageType === "UNIT") {
							// UNIT type: TRAVELER price = both ADULT and CHILD
							const travelerPricing = pricingDetails.find((p: any) => p.ageBand === "TRAVELER")
							mainPrice = travelerPricing?.price?.original?.recommendedRetailPrice || 0
							childPrice = mainPrice // Same as main
						} else {
							// PER_PERSON type: Separate ADULT and CHILD prices
							const adultPricing = pricingDetails.find((p: any) => p.ageBand === "ADULT")
							const childPricingData = pricingDetails.find((p: any) => p.ageBand === "CHILD")
							mainPrice = adultPricing?.price?.original?.recommendedRetailPrice || 0
							childPrice = childPricingData?.price?.original?.recommendedRetailPrice || null
						}

						await new ActivityPackagePriceModel().create(
							{
								activity_package_id: newPackage.id,
								main_price: mainPrice,
								child_price: childPrice,
								currency_id: currency.id,
								start_date: null, // constant_price = true
								end_date: null,
							},
							trx,
						)
					}

					// 15. Add images to activity_package_images
					if (product.images && product.images.length > 0) {
						for (const image of product.images) {
							const variant = image.variants?.find((v: any) => v.width === 720 && v.height === 480) || image.variants?.[0]

							if (variant?.url) {
								await new ActivityPackageImageModel().create(
									{
										activity_package_id: newPackage.id,
										image_url: variant.url,
									},
									trx,
								)
							}
						}
					}
				}
			}
		})

		console.log(`         ✅ Synced: ${product.title}`)
		return "synced"
	} catch (err: any) {
		console.error(`         ❌ Error: ${err.message}`)
		return "error"
	}
}
