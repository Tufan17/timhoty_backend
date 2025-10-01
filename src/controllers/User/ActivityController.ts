import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import ActivityTypeModel from "@/models/ActivityTypeModel"

export default class ActivityController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language

			const { location_id, page = 1, limit = 5, guest_rating, arrangement, min_price, max_price, type } = req.query as any

			const countQuery = knex("activities")
				.innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
				 .where("activities.status", true)
				 .where("activities.admin_approval", true)

				.whereNull("activities.deleted_at")
				.where("activity_pivots.language_code", language)
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("activities.location_id", location_id)
					}
					if (guest_rating) {
						queryBuilder.where("activities.average_rating", ">=", guest_rating)
					}
					if (type && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(type)) {
						queryBuilder.where("activities.activity_type_id", type)
					}
				})
				.groupBy("activities.id")
				.countDistinct("activities.id as total")

			let activities = await knex("activities")
				.whereNull("activities.deleted_at")
				.where("activities.status", true)
				.where("activities.admin_approval", true)
				.innerJoin("activity_pivots", function () {
					this.on("activities.id", "activity_pivots.activity_id").andOn("activity_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("cities", "activities.location_id", "cities.id")
				.innerJoin("activities_type_pivots", function () {
					this.on("activities.activity_type_id", "activities_type_pivots.activity_type_id").andOn("activities_type_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("country_pivots", function () {
					this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("city_pivots", function () {
					this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
				})
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("activities.location_id", location_id)
					}
					if (type && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(type)) {
						queryBuilder.where("activities.activity_type_id", type)
					}
				})
				.limit(limit)
				.offset((page - 1) * limit)
				.select(
					"activities.id",
					"activity_pivots.title",
					"country_pivots.name as country_name",
					"city_pivots.name as city_name",
					"city_pivots.city_id as location_id",
					"country_pivots.country_id as country_id",
					"activities.activity_type_id",
					"activities.about_to_run_out",
					"activities.average_rating",
					"activities_type_pivots.name as activity_type_name",
					"activities.comment_count",
					"activities.duration",
					"activities.map_location",
					"activities.approval_period"
				)

			// Get all car_rental packages for all activity in one query
			const activityIds = activities.map((activity: any) => activity.id)
			const mainImages = await knex("activity_galleries").select("activity_id", "image_url").whereIn("activity_id", activityIds).whereNull("deleted_at").whereRaw(`id IN (
        SELECT id FROM activity_galleries ag
        WHERE ag.activity_id = activity_galleries.activity_id
        AND ag.deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 1
    )`)
			activities.forEach((activity: any) => {
				const image_url = mainImages.find((img: any) => img.activity_id === activity.id)
				activity.image_url = image_url ? image_url.image_url : null
			})

			// Get all car_rental packages for all activity in one query
			const allactivityPackages = await knex("activity_packages")
				.whereIn("activity_packages.activity_id", activityIds)
				.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
				.where("activity_package_pivots.language_code", language)
				.whereNull("activity_packages.deleted_at")
				.select("activity_packages.id", "activity_packages.activity_id", "activity_package_pivots.name", "return_acceptance_period", "discount", "total_tax_amount", "constant_price")

			// Group car_rental packages by activity_id
			const activityPackagesByactivityId = allactivityPackages.reduce((acc: Record<string, any[]>, pkg: any) => {
				if (!acc[pkg.activity_id]) {
					acc[pkg.activity_id] = []
				}
				acc[pkg.activity_id].push(pkg)
				return acc
			}, {} as Record<string, any[]>)

			// Assign car_rental packages to activity
			activities.forEach((activity: any) => {
				activity.activity_packages = activityPackagesByactivityId[activity.id] || []
			})

			// Get all car_rental package prices in one query
			const allactivityPackageIds = allactivityPackages.map((pkg: any) => pkg.id)
			const allactivityPackagePrices = await knex("activity_package_prices")
				.whereIn("activity_package_prices.activity_package_id", allactivityPackageIds)
				.innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
				.innerJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", language)
				.whereNull("activity_package_prices.deleted_at")
				.select("activity_package_prices.id", "activity_package_prices.activity_package_id", "activity_package_prices.main_price", "activity_package_prices.child_price", "activity_package_prices.currency_id", "currency_pivots.name", "currencies.code", "currencies.symbol")
			const allactivityPackageHours = await knex("activity_package_hours").whereIn("activity_package_hours.activity_package_id", allactivityPackageIds).whereNull("activity_package_hours.deleted_at").select("activity_package_hours.*").orderBy("hour", "asc").orderBy("minute", "asc")

			// Group prices by activity_package_id (only keep the first price for each package)
			const pricesByPackageId = allactivityPackagePrices.reduce((acc: Record<string, any>, price: any) => {
				if (!acc[price.activity_package_id]) {
					acc[price.activity_package_id] = price
				}
				return acc
			}, {} as Record<string, any>)
			const hoursByPackageId = allactivityPackageHours.reduce((acc: Record<string, any[]>, hour: any) => {
				if (!acc[hour.activity_package_id]) {
					acc[hour.activity_package_id] = []
				}
				acc[hour.activity_package_id].push(hour)
				return acc
			}, {} as Record<string, any[]>)

			// Assign prices to car_rental packages
			activities.forEach((activity: any) => {
				if (activity.activity_packages) {
					// Assign prices to car_rental packages
					activity.activity_packages.forEach((activityPackage: any) => {
						activityPackage.activity_package_price = pricesByPackageId[activityPackage.id] || null
						activityPackage.activity_package_hours = hoursByPackageId[activityPackage.id] || []
					})

					// Find the car_rental package with the lowest main_price
					const cheapestPackage = activity.activity_packages.reduce((lowest: any, current: any) => {
						const lowestPrice = lowest?.activity_package_price?.main_price ?? Infinity
						const currentPrice = current?.activity_package_price?.main_price ?? Infinity

						return currentPrice < lowestPrice ? current : lowest
					}, null)

					// Keep only the cheapest package
					activity.activity_packages = cheapestPackage ? cheapestPackage : null

					let totalPrice = 0
					// Note: baby_price column doesn't exist in activity_package_prices table

					if (activity.activity_packages && activity.activity_packages.activity_package_price) {
						totalPrice += activity.activity_packages.activity_package_price.main_price * 1
					}
					activity.total_price = totalPrice
				}
			})

			if (min_price) {
				activities = activities.filter((activity: any) => (activity.total_price || 0) >= min_price)
			}
			if (max_price) {
				activities = activities.filter((activity: any) => (activity.total_price || 0) <= max_price)
			}

			if (arrangement === "price_increasing") {
				activities.sort((a: any, b: any) => (a.total_price || 0) - (b.total_price || 0))
			} else if (arrangement === "price_decreasing") {
				activities.sort((a: any, b: any) => (b.total_price || 0) - (a.total_price || 0))
			} else if (arrangement === "star_increasing") {
				activities.sort((a: any, b: any) => 0)
			} else if (arrangement === "star_decreasing") {
				activities.sort((a: any, b: any) => 0)
			} else if (arrangement === "rating_increasing") {
				activities.sort((a: any, b: any) => a.average_rating - b.average_rating)
			} else if (arrangement === "rating_decreasing") {
				activities.sort((a: any, b: any) => b.average_rating - a.average_rating)
			}

			const total = await countQuery.first()
			const totalPages = Math.ceil(total?.total ?? 0 / Number(limit))
			return res.status(200).send({
				success: true,
				message: "activities fetched successfully",
				data: activities,
				total: Number(total?.total),
				totalPages: totalPages,
			})
		} catch (error) {
			console.error("activities error:", error)
			return res.status(500).send({
				success: false,
				message: "activities fetch failed",
			})
		}
	}

	async activityTypes(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language ?? "en"
			const activityTypeModel = new ActivityTypeModel()
			const activityTypes = await activityTypeModel.getPivots(language)
			return res.status(200).send({
				success: true,
				message: "activity_types fetched successfully",
				data: activityTypes,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: "activity_types fetch failed",
			})
		}
	}
	async show(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as any
			const language = (req as any).language

			// Tek sorguda tüm veriyi çek - LEFT JOIN kullanarak
			const results = await knex("activities")
				.where("activities.id", id)
				.whereNull("activities.deleted_at")
				.where("activities.status", true)
				.where("activities.admin_approval", true)

				// Activity bilgileri
				.innerJoin("activity_pivots", function () {
					this.on("activities.id", "activity_pivots.activity_id").andOn("activity_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("activity_pivots.deleted_at")

				// Activity Type bilgileri
				.leftJoin("activities_type_pivots", function () {
					this.on("activities.activity_type_id", "activities_type_pivots.activity_type_id").andOn("activities_type_pivots.language_code", knex.raw("?", [language]))
				})

				// Şehir ve ülke bilgileri
				.innerJoin("cities", "activities.location_id", "cities.id")
				.innerJoin("country_pivots", function () {
					this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("country_pivots.deleted_at")
				.innerJoin("city_pivots", function () {
					this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("city_pivots.deleted_at")

				// Gallery bilgileri
				.leftJoin("activity_galleries", "activities.id", "activity_galleries.activity_id")
				.leftJoin("activity_gallery_pivots", function () {
					this.on("activity_galleries.id", "activity_gallery_pivots.activity_gallery_id")
						.andOn("activity_gallery_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_galleries.deleted_at")
						.andOnNull("activity_gallery_pivots.deleted_at")
				})

				// Activity özellikleri
				.leftJoin("activity_features", "activities.id", "activity_features.activity_id")
				.leftJoin("activity_feature_pivots", function () {
					this.on("activity_features.id", "activity_feature_pivots.activity_feature_id")
						.andOn("activity_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_features.deleted_at")
						.andOnNull("activity_feature_pivots.deleted_at")
				})

				// Paket bilgileri
				.leftJoin("activity_packages", "activities.id", "activity_packages.activity_id")
				.leftJoin("activity_package_pivots", function () {
					this.on("activity_packages.id", "activity_package_pivots.activity_package_id")
						.andOn("activity_package_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_packages.deleted_at")
						.andOnNull("activity_package_pivots.deleted_at")
				})

				// Paket fiyatları
				.leftJoin("activity_package_prices", function () {
					this.on("activity_packages.id", "activity_package_prices.activity_package_id").andOnNull("activity_package_prices.deleted_at")
				})

				// Para birimi bilgileri
				.leftJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function () {
					this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
				})

				// Paket saatleri
				.leftJoin("activity_package_hours", function () {
					this.on("activity_packages.id", "activity_package_hours.activity_package_id").andOnNull("activity_package_hours.deleted_at")
				})

				// Paket resimleri
				.leftJoin("activity_package_images", function () {
					this.on("activity_packages.id", "activity_package_images.activity_package_id").andOnNull("activity_package_images.deleted_at")
				})

				// Paket olanakları
				.leftJoin("activity_package_opportunities", "activity_packages.id", "activity_package_opportunities.activity_package_id")
				.leftJoin("activity_package_opportunity_pivots", function () {
					this.on("activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
						.andOn("activity_package_opportunity_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_package_opportunities.deleted_at")
						.andOnNull("activity_package_opportunity_pivots.deleted_at")
				})

				// Paket özellikleri
				.leftJoin("activity_package_features", "activity_packages.id", "activity_package_features.activity_package_id")
				.leftJoin("activity_package_feature_pivots", function () {
					this.on("activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
						.andOn("activity_package_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_package_features.deleted_at")
						.andOnNull("activity_package_feature_pivots.deleted_at")
				})

				.select(
					// Activity bilgileri
					"activities.*",
					"activity_pivots.title as activity_title",
					"activity_pivots.general_info",
					"activity_pivots.activity_info",
					"activity_pivots.refund_policy as activity_refund_policy",

					// Activity type bilgileri
					"activities_type_pivots.name as activity_type_name",

					// Lokasyon bilgileri
					"country_pivots.name as country_name",
					"city_pivots.name as city_name",

					// Gallery bilgileri
					"activity_galleries.id as gallery_id",
					"activity_galleries.image_url as gallery_image_url",
					"activity_galleries.image_type as gallery_image_type",
					"activity_gallery_pivots.category as gallery_category",

					// Activity features
					"activity_features.id as feature_id",
					"activity_features.status as feature_status",
					"activity_feature_pivots.name as feature_name",

					// Paket bilgileri
					"activity_packages.id as package_id",
					"activity_package_pivots.name as package_name",
					"activity_package_pivots.description as package_description",
					"activity_package_pivots.refund_policy as package_refund_policy",
					"activity_packages.return_acceptance_period",
					"activity_packages.discount",
					"activity_packages.date",
					"activity_packages.total_tax_amount",
					"activity_packages.constant_price",

					// Paket fiyatları
					"activity_package_prices.id as price_id",
					"activity_package_prices.main_price",
					"activity_package_prices.child_price",
					"activity_package_prices.start_date",
					"activity_package_prices.end_date",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",

					// Paket saatleri
					"activity_package_hours.id as hour_id",
					"activity_package_hours.hour",
					"activity_package_hours.minute",

					// Paket resimleri
					"activity_package_images.id as package_image_id",
					"activity_package_images.image_url as package_image_url",

					// Paket olanakları
					"activity_package_opportunities.id as package_opportunity_id",
					"activity_package_opportunity_pivots.name as package_opportunity_name",

					// Paket özellikleri
					"activity_package_features.id as package_feature_id",
					"activity_package_features.status as package_feature_status",
					"activity_package_feature_pivots.name as package_feature_name"
				)

			if (results.length === 0) {
				return res.status(404).send({
					success: false,
					message: "Activity not found",
				})
			}

			// İlk satırdan activity bilgilerini al
			const firstRow = results[0]
			const activity = {
				id: firstRow.id,
				title: firstRow.activity_title,
				general_info: firstRow.general_info,
				activity_info: firstRow.activity_info,
				refund_policy: firstRow.activity_refund_policy,
				activity_type_name: firstRow.activity_type_name,
				country_name: firstRow.country_name,
				city_name: firstRow.city_name,
				duration: firstRow.duration,
				average_rating: firstRow.average_rating,
				comment_count: firstRow.comment_count,
				map_location: firstRow.map_location,
				approval_period: firstRow.approval_period,
				about_to_run_out: firstRow.about_to_run_out,
				free_purchase: firstRow.free_purchase,
				created_at: firstRow.created_at,
				updated_at: firstRow.updated_at,
				packages: [],
				galleries: [],
				features: [],
			}

			// grupla ve yapılandır
			const packageMap = new Map()
			const now = new Date()

			results.forEach((row: any) => {
				if (!row.package_id) return // Paket yoksa atla

				if (!packageMap.has(row.package_id)) {
					packageMap.set(row.package_id, {
						id: row.package_id,
						date: row.date,
						name: row.package_name,
						description: row.package_description,
						refund_policy: row.package_refund_policy,
						return_acceptance_period: row.return_acceptance_period,
						discount: row.discount,
						total_tax_amount: row.total_tax_amount,
						constant_price: row.constant_price,
						images: [],
						hours: [],
						opportunities: [],
						features: [],
						selectedPrice: null,
					})
				}

				const packageData = packageMap.get(row.package_id)

				// Paket resimleri
				if (row.package_image_id) {
					const existingImage = packageData.images.find((img: any) => img.id === row.package_image_id)
					if (!existingImage) {
						packageData.images.push({
							id: row.package_image_id,
							image_url: row.package_image_url,
						})
					}
				}

				// Paket saatleri
				if (row.hour_id) {
					const existingHour = packageData.hours.find((hour: any) => hour.id === row.hour_id)
					if (!existingHour) {
						packageData.hours.push({
							id: row.hour_id,
							hour: row.hour,
							minute: row.minute,
						})
					}
				}

				// Paket olanakları
				if (row.package_opportunity_id) {
					const existingOpportunity = packageData.opportunities.find((opp: any) => opp.id === row.package_opportunity_id)
					if (!existingOpportunity) {
						packageData.opportunities.push({
							id: row.package_opportunity_id,
							name: row.package_opportunity_name,
						})
					}
				}

				// Paket özellikleri
				if (row.package_feature_id) {
					const existingFeature = packageData.features.find((feat: any) => feat.id === row.package_feature_id)
					if (!existingFeature) {
						packageData.features.push({
							id: row.package_feature_id,
							name: row.package_feature_name,
							status: row.package_feature_status,
						})
					}
				}
				// console.log(row)
				// Paket fiyatları
				if (row.price_id && !packageData.selectedPrice) {
					let selectedPrice = null

					if (row.constant_price) {
						selectedPrice = {
							id: row.price_id,
							main_price: row.main_price,
							child_price: row.child_price,

							start_date: row.start_date,
							end_date: row.end_date,
							currency: {
								name: row.currency_name,
								code: row.currency_code,
								symbol: row.currency_symbol,
							},
						}
					} else {
						// Sabit fiyat değilse - fakat burada daha esnek bir yaklaşım uygulayalım
						if (row.start_date && row.end_date) {
							const startDate = new Date(row.start_date)
							const endDate = new Date(row.end_date)
							const today = new Date()

							// Eğer aktivite gelecekteki bir tarih için ise, o fiyatı göster
							// Veya eğer bugün tarih aralığında ise göster
							if (today <= endDate) {
								// Sadece bitiş tarihini kontrol et
								selectedPrice = {
									id: row.price_id,
									main_price: row.main_price,
									child_price: row.child_price,

									start_date: row.start_date,
									end_date: row.end_date,
									currency: {
										name: row.currency_name,
										code: row.currency_code,
										symbol: row.currency_symbol,
									},
								}
							}
						} else {
							// Tarih aralığı yoksa direkt fiyatı al
							selectedPrice = {
								id: row.price_id,
								main_price: row.main_price,
								child_price: row.child_price,

								start_date: row.start_date,
								end_date: row.end_date,
								currency: {
									name: row.currency_name,
									code: row.currency_code,
									symbol: row.currency_symbol,
								},
							}
						}
					}

					if (selectedPrice) {
						packageData.selectedPrice = selectedPrice
					}
				}
			})

			// Paket saatlerini sırala
			packageMap.forEach(packageData => {
				packageData.hours.sort((a: any, b: any) => {
					if (a.hour !== b.hour) return a.hour - b.hour
					return a.minute - b.minute
				})
			})

			activity.packages = Array.from(packageMap.values()).map((pkg: any) => ({
				...pkg,
				price: pkg.selectedPrice,
				selectedPrice: undefined,
			})) as any

			// Gallery verilerini grupla
			const galleryMap = new Map()

			results.forEach((row: any) => {
				if (!row.gallery_id) return

				if (!galleryMap.has(row.gallery_id)) {
					galleryMap.set(row.gallery_id, {
						id: row.gallery_id,
						image_url: row.gallery_image_url,
						image_type: row.gallery_image_type,
						category: row.gallery_category,
					})
				}
			})

			activity.galleries = Array.from(galleryMap.values()) as any

			// Activity özelliklerini grupla
			const featureMap = new Map()

			results.forEach((row: any) => {
				if (!row.feature_id) return

				if (!featureMap.has(row.feature_id)) {
					featureMap.set(row.feature_id, {
						id: row.feature_id,
						name: row.feature_name,
						status: row.feature_status,
					})
				}
			})

			activity.features = Array.from(featureMap.values()) as any

			return res.status(200).send({
				success: true,
				message: "Activity retrieved successfully",
				data: activity,
			})
		} catch (error) {
			console.error("Activity show error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve activity",
			})
		}
	}
}
