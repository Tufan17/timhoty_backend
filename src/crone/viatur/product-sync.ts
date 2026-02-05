import { viatorApiService } from "@/services/ViatorApi"
import ActivityModel from "@/models/ActivityModel"
import CityModel from "@/models/CityModel"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import { translateCreate } from "@/helper/translate"

export async function syncProducts() {
	try {
		// 1. Search all products (pagination will be needed for 31k products)
		const limit = 10 // Test with 10, production will use pagination
		const searchResult = await viatorApiService.searchProducts({
			pagination: { offset: 0, limit: limit },
			currency: "USD",
		})

		const productCodes = searchResult.products?.map((p: any) => p.productCode) || []
		console.log(`✅ Found ${productCodes.length} products to sync`)

		let syncedCount = 0
		let skippedCount = 0

		// 2. Get detailed info for each product
		for (let i = 0; i < productCodes.length; i++) {
			try {
				const productCode = productCodes[i]
				console.log(`\n📦 [${i + 1}/${productCodes.length}] Processing: ${productCode}`)

				const product = await viatorApiService.getProduct(productCode)

				// 3. Filter by itinerary type (STANDARD or ACTIVITY only)
				if (product.itinerary?.itineraryType !== "STANDARD" && product.itinerary?.itineraryType !== "ACTIVITY") {
					console.log(`⏭️  Skipped: itineraryType is ${product.itinerary?.itineraryType}`)
					skippedCount++
					continue
				}

				// 4. Duplicate check - productCode'a göre kontrol
				const existing = await new ActivityModel().first({
					product_code: product.productCode,
				})

				if (existing) {
					console.log(`⏭️  Skipped: Already exists`)
					skippedCount++
					continue
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
						console.log(`⚠️  Warning: City not found for destination ${primaryDestination.ref}`)
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
							console.log(`✅ Matched tag ${tagId} to activity_type ${activityTypeId}`)
							break
						}
					}

					if (!activityTypeId) {
						console.log(`⚠️  Warning: No matching activity type found for tags: ${product.tags.join(", ")}`)
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

				// 10. Create activity
				const newActivity = await new ActivityModel().create({
					location_id: cityId,
					solution_partner_id: null, // Viator products don't have solution_partner
					status: true, // Default true for Viator products
					admin_approval: true, // Default true for Viator products
					activity_type_id: activityTypeId,
					product_code: product.productCode, // Store Viator product code
					type: "viator", // Viator type
					duration: duration,
					map_location: null, // Can be extracted from logistics if needed
					approval_period: null,
					comment_count: 0,
					average_rating: product.reviews?.combinedAverageRating || 0,
				})

				// 11. Create activity pivot (EN + TR via translateCreate)
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
				})

				console.log(`✅ Synced: ${product.title}`)
				syncedCount++
			} catch (err: any) {
				console.error(`❌ Product sync error (${productCodes[i]}):`, err.message)
				skippedCount++
			}
		}

		console.log(`\n✅ ===== PRODUCT SYNC COMPLETE =====`)
		console.log(`   Synced: ${syncedCount}`)
		console.log(`   Skipped: ${skippedCount}`)

		return {
			success: true,
			message: "Products synced successfully",
			data: {
				total: productCodes.length,
				synced: syncedCount,
				skipped: skippedCount,
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
