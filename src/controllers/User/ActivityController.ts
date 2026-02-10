import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import ActivityModel from "@/models/ActivityModel"
import viatorController from "@/controllers/v2/ViatorController"

export default class ActivityController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language
			const now = new Date()
			const today = now.toISOString().split("T")[0]

			const { location_id, page = 1, limit = 5, guest_rating, arrangement, min_price, max_price, type, title } = req.query as any

			const countQuery = knex("activities")
				.innerJoin("activity_pivots", "activities.id", "activity_pivots.activity_id")
				.where("activities.status", true)
				.where("activities.admin_approval", true)
				.whereNull("activities.deleted_at")
				.where("activity_pivots.language_code", language)
				.whereNull("activity_pivots.deleted_at")
				// Paketi ve fiyatı olan aktiviteleri filtrele (en düşük fiyata göre)
				.whereExists(function () {
					this.select(knex.raw(1))
						.from("activity_packages")
						.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
						.innerJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
						.whereRaw("activity_packages.activity_id = activities.id")
						.whereNull("activity_packages.deleted_at")
						.whereNull("activity_package_prices.deleted_at")
						.where("activity_package_pivots.language_code", language)
						.where(function () {
							// Sabit fiyatlı paketler için tüm fiyatları getir
							this.where("activity_packages.constant_price", true).orWhere(function () {
								// Değişken fiyatlı paketler için sadece geçerli tarihteki fiyatları getir
								this.where("activity_packages.constant_price", false)
									.andWhere("activity_package_prices.start_date", "<=", today)
									.andWhere(function () {
										this.whereNull("activity_package_prices.end_date").orWhere("activity_package_prices.end_date", ">=", today)
									})
							})
						})
				})
				// En düşük paket fiyatına göre min_price/max_price filtresi
				.modify(function (queryBuilder) {
					if (min_price || max_price) {
						// En düşük paket fiyatını raw SQL subquery ile hesapla ve filtrele
						const minPriceSubquerySql = `(
						SELECT MIN(app.main_price)
						FROM activity_packages ap
						INNER JOIN activity_package_pivots apv ON ap.id = apv.activity_package_id
						INNER JOIN activity_package_prices app ON ap.id = app.activity_package_id
						INNER JOIN currencies c ON app.currency_id = c.id
						INNER JOIN currency_pivots cp ON c.id = cp.currency_id
						WHERE ap.activity_id = activities.id
						AND ap.deleted_at IS NULL
						AND app.deleted_at IS NULL
						AND apv.language_code = ?
						AND cp.language_code = ?
						AND (
							ap.constant_price = true
							OR (
								ap.constant_price = false
								AND app.start_date <= ?
								AND (app.end_date IS NULL OR app.end_date >= ?)
							)
						)
					)`

						if (min_price) {
							queryBuilder.whereRaw(`${minPriceSubquerySql} >= ?`, [language, language, today, today, min_price])
						}
						if (max_price) {
							queryBuilder.whereRaw(`${minPriceSubquerySql} <= ?`, [language, language, today, today, max_price])
						}
					}
				})
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
					if (title) {
						queryBuilder.where("activity_pivots.title", "ILIKE", `%${title}%`)
					}
				})
				.countDistinct("activities.id as total")

			let activities = await knex("activities")
				.whereNull("activities.deleted_at")
				.where("activities.status", true)
				.where("activities.admin_approval", true)
				.innerJoin("activity_pivots", function () {
					this.on("activities.id", "activity_pivots.activity_id").andOn("activity_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("activity_pivots.deleted_at")
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
				// Paketi ve fiyatı olan aktiviteleri filtrele (en düşük fiyata göre)
				.whereExists(function () {
					this.select(knex.raw(1))
						.from("activity_packages")
						.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
						.innerJoin("activity_package_prices", "activity_packages.id", "activity_package_prices.activity_package_id")
						.whereRaw("activity_packages.activity_id = activities.id")
						.whereNull("activity_packages.deleted_at")
						.whereNull("activity_package_prices.deleted_at")
						.where("activity_package_pivots.language_code", language)
						.where(function () {
							// Sabit fiyatlı paketler için tüm fiyatları getir
							this.where("activity_packages.constant_price", true).orWhere(function () {
								// Değişken fiyatlı paketler için sadece geçerli tarihteki fiyatları getir
								this.where("activity_packages.constant_price", false)
									.andWhere("activity_package_prices.start_date", "<=", today)
									.andWhere(function () {
										this.whereNull("activity_package_prices.end_date").orWhere("activity_package_prices.end_date", ">=", today)
									})
							})
						})
				})
				// En düşük paket fiyatına göre min_price/max_price filtresi
				.modify(function (queryBuilder) {
					if (min_price || max_price) {
						// En düşük paket fiyatını raw SQL subquery ile hesapla ve filtrele
						const minPriceSubquerySql = `(
						SELECT MIN(app.main_price)
						FROM activity_packages ap
						INNER JOIN activity_package_pivots apv ON ap.id = apv.activity_package_id
						INNER JOIN activity_package_prices app ON ap.id = app.activity_package_id
						INNER JOIN currencies c ON app.currency_id = c.id
						INNER JOIN currency_pivots cp ON c.id = cp.currency_id
						WHERE ap.activity_id = activities.id
						AND ap.deleted_at IS NULL
						AND app.deleted_at IS NULL
						AND apv.language_code = ?
						AND cp.language_code = ?
						AND (
							ap.constant_price = true
							OR (
								ap.constant_price = false
								AND app.start_date <= ?
								AND (app.end_date IS NULL OR app.end_date >= ?)
							)
						)
					)`

						if (min_price) {
							queryBuilder.whereRaw(`${minPriceSubquerySql} >= ?`, [language, language, today, today, min_price])
						}
						if (max_price) {
							queryBuilder.whereRaw(`${minPriceSubquerySql} <= ?`, [language, language, today, today, max_price])
						}
					}
				})
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("activities.location_id", location_id)
					}
					if (type && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(type)) {
						queryBuilder.where("activities.activity_type_id", type)
					}
					if (guest_rating) {
						queryBuilder.where("activities.average_rating", ">=", guest_rating)
					}
					if (title) {
						queryBuilder.where("activity_pivots.title", "ILIKE", `%${title}%`)
					}
				})
				// Sıralama (arrangement) DB seviyesinde
				.modify(function (queryBuilder) {
					if (arrangement === "price_increasing" || arrangement === "price_decreasing") {
						// En düşük paket fiyatına göre sıralama
						const priceOrderSubquery = `(
						SELECT MIN(app.main_price)
						FROM activity_packages ap
						INNER JOIN activity_package_pivots apv ON ap.id = apv.activity_package_id
						INNER JOIN activity_package_prices app ON ap.id = app.activity_package_id
						WHERE ap.activity_id = activities.id
						AND ap.deleted_at IS NULL
						AND app.deleted_at IS NULL
						AND apv.language_code = ?
						AND (
							ap.constant_price = true
							OR (
								ap.constant_price = false
								AND app.start_date <= ?
								AND (app.end_date IS NULL OR app.end_date >= ?)
							)
						)
					)`
						const direction = arrangement === "price_increasing" ? "asc" : "desc"
						queryBuilder.orderByRaw(`${priceOrderSubquery} ${direction}`, [language, today, today])
					} else if (arrangement === "rating_increasing") {
						queryBuilder.orderBy("activities.average_rating", "asc")
					} else if (arrangement === "rating_decreasing") {
						queryBuilder.orderBy("activities.average_rating", "desc")
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
					"activities.approval_period",
					"activities.free_purchase",
				)

			// Get cover images (Kapak Resmi) for all activities
			const activityIds = activities.map((activity: any) => activity.id)
			const getCoverImageCategory = (lang: string) => {
				const categories: Record<string, string> = {
					tr: "Kapak Resmi",
					en: "Cover Image",
					ar: "صورة الغلاف",
				}
				return categories[lang] || "Kapak Resmi"
			}
			const coverImageCategory = getCoverImageCategory(language)
			const mainImages = await knex.raw(
				`
				SELECT DISTINCT ON (activities.id)
					activities.id as activity_id,
					COALESCE(
						(SELECT ag.image_url
						 FROM activity_galleries ag
						 INNER JOIN activity_gallery_pivots agp ON ag.id = agp.activity_gallery_id
						 WHERE ag.activity_id = activities.id
						 AND agp.category = ?
						 AND agp.language_code = ?
						 AND ag.deleted_at IS NULL
						 AND agp.deleted_at IS NULL
						 LIMIT 1),
						(SELECT ag.image_url
						 FROM activity_galleries ag
						 WHERE ag.activity_id = activities.id
						 AND ag.deleted_at IS NULL
						 ORDER BY ag.id
						 LIMIT 1)
					) as image_url
				FROM activities
				WHERE activities.id = ANY(?)
			`,
				[coverImageCategory, language, activityIds],
			)

			activities.forEach((activity: any) => {
				const image_url = mainImages.rows.find((img: any) => img.activity_id === activity.id)
				activity.image_url = image_url ? image_url.image_url : null
			})

			// Get all car_rental packages for all activity in one query
			const allactivityPackages = await knex("activity_packages")
				.whereIn("activity_packages.activity_id", activityIds)
				.innerJoin("activity_package_pivots", "activity_packages.id", "activity_package_pivots.activity_package_id")
				.where("activity_package_pivots.language_code", language)
				.whereNull("activity_packages.deleted_at")
				.select("activity_packages.id", "activity_packages.activity_id", "activity_package_pivots.name", "return_acceptance_period", "discount", "total_tax_amount", "constant_price")

			const activityPackagesByactivityId = allactivityPackages.reduce(
				(acc: Record<string, any[]>, pkg: any) => {
					if (!acc[pkg.activity_id]) {
						acc[pkg.activity_id] = []
					}
					acc[pkg.activity_id].push(pkg)
					return acc
				},
				{} as Record<string, any[]>,
			)

			activities.forEach((activity: any) => {
				activity.activity_packages = activityPackagesByactivityId[activity.id] || []
			})

			const allactivityPackageIds = allactivityPackages.map((pkg: any) => pkg.id)
			const allactivityPackagePrices = await knex("activity_package_prices")
				.whereIn("activity_package_prices.activity_package_id", allactivityPackageIds)
				.innerJoin("activity_packages", "activity_package_prices.activity_package_id", "activity_packages.id")
				.innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
				.innerJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", language)
				.whereNull("activity_package_prices.deleted_at")
				.where(function () {
					// Sabit fiyatlı paketler için tüm fiyatları getir
					this.where("activity_packages.constant_price", true).orWhere(function () {
						// Değişken fiyatlı paketler için sadece geçerli tarihteki fiyatları getir
						this.where("activity_packages.constant_price", false)
							.andWhere("activity_package_prices.start_date", "<=", today)
							.andWhere(function () {
								this.whereNull("activity_package_prices.end_date").orWhere("activity_package_prices.end_date", ">=", today)
							})
					})
				})
				.select("activity_package_prices.id", "activity_package_prices.activity_package_id", "activity_package_prices.main_price", "activity_package_prices.child_price", "activity_package_prices.currency_id", "currency_pivots.name", "currencies.code", "currencies.symbol")
			const allactivityPackageHours = await knex("activity_package_hours").whereIn("activity_package_hours.activity_package_id", allactivityPackageIds).whereNull("activity_package_hours.deleted_at").select("activity_package_hours.*").orderBy("hour", "asc").orderBy("minute", "asc")

			const pricesByPackageId = allactivityPackagePrices.reduce(
				(acc: Record<string, any>, price: any) => {
					if (!acc[price.activity_package_id]) {
						acc[price.activity_package_id] = price
					}
					return acc
				},
				{} as Record<string, any>,
			)
			const hoursByPackageId = allactivityPackageHours.reduce(
				(acc: Record<string, any[]>, hour: any) => {
					if (!acc[hour.activity_package_id]) {
						acc[hour.activity_package_id] = []
					}
					acc[hour.activity_package_id].push(hour)
					return acc
				},
				{} as Record<string, any[]>,
			)

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

			// activity_packages null olanları filtrele (veritabanında whereExists ile zaten kontrol ediliyor ama güvenlik için)
			let filteredActivities = activities.filter((activity: any) => activity.activity_packages !== null)

			// min_price, max_price filtresi ve sıralama (arrangement) artık veritabanı seviyesinde uygulanıyor

			const countResult = await countQuery.first()

			const total = Number(countResult?.total ?? 0)

			const totalPages = Math.ceil(total / Number(limit))
			return res.status(200).send({
				success: true,
				message: "activities fetched successfully",
				data: filteredActivities,
				// total: Number(filteredActivities.length),
				total: total,
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

				// .leftJoin("activity_package_features", function () {
				// 	this.on("activity_packages.id", "activity_package_features.activity_package_id").andOnNull("activity_package_features.deleted_at")
				// })
				// .leftJoin("activity_package_feature_pivots", function () {
				// 	this.on("activity_package_features.id", "activity_package_feature_pivots.activity_package_feature_id")
				// 		.andOn("activity_package_feature_pivots.language_code", knex.raw("?", [language]))
				// 		.andOnNull("activity_package_feature_pivots.deleted_at")
				// })
				.leftJoin("activity_galleries", function () {
					this.on("activities.id", "activity_galleries.activity_id").andOnNull("activity_galleries.deleted_at")
				})
				.leftJoin("activity_gallery_pivots", function () {
					this.on("activity_galleries.id", "activity_gallery_pivots.activity_gallery_id")
						.andOn("activity_gallery_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_galleries.deleted_at")
						.andOnNull("activity_gallery_pivots.deleted_at")
				})

				// Activity özellikleri (services_included_excluded tablosundan - type: normal)
				.leftJoin("services_included_excluded as activity_features", function () {
					this.on("activities.id", "activity_features.service_id")
						.andOn("activity_features.service_type", knex.raw("?", ["activity"]))
						.andOn("activity_features.type", knex.raw("?", ["normal"]))
						.andOnNull("activity_features.deleted_at")
				})
				.leftJoin("included_excluded as activity_feature_ie", "activity_features.included_excluded_id", "activity_feature_ie.id")
				.leftJoin("included_excluded_pivot as activity_feature_pivots", function () {
					this.on("activity_feature_ie.id", "activity_feature_pivots.included_excluded_id")
						.andOn("activity_feature_pivots.language_code", knex.raw("?", [language]))
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
				.leftJoin("activity_package_opportunities", function () {
					this.on("activity_packages.id", "activity_package_opportunities.activity_package_id").andOnNull("activity_package_opportunities.deleted_at")
				})
				.leftJoin("activity_package_opportunity_pivots", function () {
					this.on("activity_package_opportunities.id", "activity_package_opportunity_pivots.activity_package_opportunity_id")
						.andOn("activity_package_opportunity_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("activity_package_opportunity_pivots.deleted_at")
				})

				// Paket özellikleri (services_included_excluded tablosundan - type: package)
				.leftJoin("services_included_excluded as activity_package_features", function () {
					this.on("activity_packages.id", "activity_package_features.service_id")
						.andOn("activity_package_features.service_type", knex.raw("?", ["activity"]))
						.andOn("activity_package_features.type", knex.raw("?", ["package"]))
						.andOnNull("activity_package_features.deleted_at")
				})
				.leftJoin("included_excluded as package_feature_ie", "activity_package_features.included_excluded_id", "package_feature_ie.id")
				.leftJoin("included_excluded_pivot as activity_package_feature_pivots", function () {
					this.on("package_feature_ie.id", "activity_package_feature_pivots.included_excluded_id")
						.andOn("activity_package_feature_pivots.language_code", knex.raw("?", [language]))
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
					"activity_packages.start_date as package_start_date",
					"activity_packages.end_date as package_end_date",
					"activity_packages.total_tax_amount",
					"activity_packages.constant_price",

					// Paket fiyatları
					"activity_package_prices.id as price_id",
					"activity_package_prices.main_price",
					"activity_package_prices.child_price",
					"activity_package_prices.start_date as price_start_date",
					"activity_package_prices.end_date as price_end_date",
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
					"activity_package_feature_pivots.name as package_feature_name",
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
				comments: [],
			}

			// grupla ve yapılandır
			const packageMap = new Map()
			const now = new Date()

			results.forEach((row: any) => {
				if (!row.package_id) return // Paket yoksa atla

				if (!packageMap.has(row.package_id)) {
					packageMap.set(row.package_id, {
						id: row.package_id,
						start_date: row.package_start_date,
						name: row.package_name,
						description: row.package_description,
						refund_policy: row.package_refund_policy,
						end_date: row.package_end_date,
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

							start_date: row.price_start_date,
							end_date: row.price_end_date,
							currency: {
								name: row.currency_name,
								code: row.currency_code,
								symbol: row.currency_symbol,
							},
						}
					} else {
						// Sabit fiyat değilse - fakat burada daha esnek bir yaklaşım uygulayalım
						if (row.price_start_date && row.price_end_date) {
							const startDate = new Date(row.price_start_date)
							const endDate = new Date(row.price_end_date)
							const today = new Date()

							// Eğer aktivite gelecekteki bir tarih için ise, o fiyatı göster
							// Veya eğer bugün tarih aralığında ise göster
							if (today <= endDate) {
								// Sadece bitiş tarihini kontrol et
								selectedPrice = {
									id: row.price_id,
									main_price: row.main_price,
									child_price: row.child_price,

									start_date: row.price_start_date,
									end_date: row.price_end_date,
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

								start_date: row.price_start_date,
								end_date: row.price_end_date,
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

			const activityModel = new ActivityModel()
			const comments = await activityModel.getComments(language, 100, id)
			activity.comments = comments as any

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

	/**
	 * v2 Show - Routes to Viator API or internal show based on activity type
	 */
	v2_show = async (req: FastifyRequest, res: FastifyReply) => {
		try {
			const { id } = req.params as { id: string }
			const language = (req as any).language

			// First find the activity with pivot data
			const activityData = await knex("activities")
				.where("activities.id", id)
				.whereNull("activities.deleted_at")
				.where("activities.status", true)
				.where("activities.admin_approval", true)
				.innerJoin("activity_pivots", function () {
					this.on("activities.id", "activity_pivots.activity_id").andOn("activity_pivots.language_code", knex.raw("?", [language]))
				})
				.leftJoin("activities_type_pivots", function () {
					this.on("activities.activity_type_id", "activities_type_pivots.activity_type_id").andOn("activities_type_pivots.language_code", knex.raw("?", [language]))
				})
				.leftJoin("cities", "activities.location_id", "cities.id")
				.leftJoin("country_pivots", function () {
					this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.leftJoin("city_pivots", function () {
					this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
				})
				.select("activities.*", "activity_pivots.title", "activity_pivots.general_info", "activity_pivots.activity_info", "activity_pivots.refund_policy", "activities_type_pivots.name as activity_type_name", "country_pivots.name as country_name", "city_pivots.name as city_name")
				.first()

			if (!activityData) {
				return res.status(404).send({
					success: false,
					message: "Activity not found",
				})
			}

			// Route based on type
			if (activityData.type === "viator" && activityData.product_code) {
				// Viator type - fetch from Viator API and combine with DB data
				try {
					const productDetails = await viatorController.getProductDetails(activityData.product_code)

					// Get packages from DB
					const dbPackages = await knex("activity_packages")
						.where("activity_packages.activity_id", id)
						.whereNull("activity_packages.deleted_at")
						.innerJoin("activity_package_pivots", function () {
							this.on("activity_packages.id", "activity_package_pivots.activity_package_id").andOn("activity_package_pivots.language_code", knex.raw("?", [language]))
						})
						.select("activity_packages.id", "activity_packages.start_date", "activity_packages.end_date", "activity_packages.return_acceptance_period", "activity_packages.discount", "activity_packages.total_tax_amount", "activity_packages.constant_price", "activity_package_pivots.name", "activity_package_pivots.description", "activity_package_pivots.refund_policy")

					// Get package prices
					const packageIds = dbPackages.map((p: any) => p.id)
					const dbPrices = await knex("activity_package_prices")
						.whereIn("activity_package_id", packageIds)
						.whereNull("activity_package_prices.deleted_at")
						.innerJoin("currencies", "activity_package_prices.currency_id", "currencies.id")
						.leftJoin("currency_pivots", function () {
							this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
						})
						.select("activity_package_prices.id", "activity_package_prices.activity_package_id", "activity_package_prices.main_price", "activity_package_prices.child_price", "activity_package_prices.start_date", "activity_package_prices.end_date", "currency_pivots.name as currency_name", "currencies.code as currency_code", "currencies.symbol as currency_symbol")

					// Get package images from DB
					const dbPackageImages = await knex("activity_package_images").whereIn("activity_package_id", packageIds).whereNull("activity_package_images.deleted_at").select("id", "activity_package_id", "image_url")

					// Get galleries from DB
					const dbGalleries = await knex("activity_galleries")
						.where("activity_id", id)
						.whereNull("activity_galleries.deleted_at")
						.leftJoin("activity_gallery_pivots", function () {
							this.on("activity_galleries.id", "activity_gallery_pivots.activity_gallery_id").andOn("activity_gallery_pivots.language_code", knex.raw("?", [language]))
						})
						.select("activity_galleries.id", "activity_galleries.image_url", "activity_galleries.image_type", "activity_gallery_pivots.category")

					// Extract hours from Viator availability schedule
					const extractHours = (availabilitySchedule: any) => {
						const hours: { id: string; hour: number; minute: number }[] = []
						const bookableItem = availabilitySchedule?.bookableItem
						if (!bookableItem?.seasons) return hours

						for (const season of bookableItem.seasons) {
							for (const pricingRecord of season.pricingRecords || []) {
								for (const timedEntry of pricingRecord.timedEntries || []) {
									if (timedEntry.startTime) {
										const [hourStr, minuteStr] = timedEntry.startTime.split(":")
										const hour = parseInt(hourStr, 10)
										const minute = parseInt(minuteStr, 10)
										// Avoid duplicates
										const exists = hours.some(h => h.hour === hour && h.minute === minute)
										if (!exists) {
											hours.push({
												id: `viator-${hour}-${minute}`,
												hour,
												minute,
											})
										}
									}
								}
							}
						}
						// Sort hours
						hours.sort((a, b) => (a.hour !== b.hour ? a.hour - b.hour : a.minute - b.minute))
						return hours
					}

					// Extract unavailable dates from Viator availability schedule
					const extractUnavailableDates = (availabilitySchedule: any) => {
						const unavailableDates: { date: string; reason: string }[] = []
						const bookableItem = availabilitySchedule?.bookableItem
						if (!bookableItem?.seasons) return unavailableDates

						for (const season of bookableItem.seasons) {
							for (const pricingRecord of season.pricingRecords || []) {
								for (const timedEntry of pricingRecord.timedEntries || []) {
									for (const unavailable of timedEntry.unavailableDates || []) {
										// Avoid duplicates
										const exists = unavailableDates.some(u => u.date === unavailable.date)
										if (!exists) {
											unavailableDates.push({
												date: unavailable.date,
												reason: unavailable.reason || "UNAVAILABLE",
											})
										}
									}
								}
							}
						}
						// Sort by date
						unavailableDates.sort((a, b) => a.date.localeCompare(b.date))
						return unavailableDates
					}

					// Extract inclusions and exclusions as features from Viator product
					const extractFeatures = (inclusions: any[], exclusions: any[]) => {
						const features: { id: string; name: string; status: boolean }[] = []

						// Add inclusions (status: true)
						if (inclusions && Array.isArray(inclusions)) {
							inclusions.forEach((inclusion: any, index: number) => {
								features.push({
									id: `viator-inclusion-${index}`,
									name: inclusion.otherDescription || inclusion.description || inclusion.typeDescription || "",
									status: true,
								})
							})
						}

						// Add exclusions (status: false)
						if (exclusions && Array.isArray(exclusions)) {
							exclusions.forEach((exclusion: any, index: number) => {
								features.push({
									id: `viator-exclusion-${index}`,
									name: exclusion.otherDescription || exclusion.description || exclusion.typeDescription || "",
									status: false,
								})
							})
						}

						return features
					}

					// Parse hours and unavailable dates
					const viatorHours = extractHours(productDetails.availabilitySchedule)
					const viatorUnavailableDates = extractUnavailableDates(productDetails.availabilitySchedule)
					const viatorFeatures = extractFeatures(productDetails.inclusions, productDetails.exclusions)

					// Build packages with DB data + Viator hours
					const packages = dbPackages.map((pkg: any) => {
						const price = dbPrices.find((p: any) => p.activity_package_id === pkg.id)
						const images = dbPackageImages.filter((img: any) => img.activity_package_id === pkg.id)

						return {
							id: pkg.id,
							start_date: pkg.start_date,
							name: pkg.name,
							description: pkg.description,
							refund_policy: pkg.refund_policy,
							end_date: pkg.end_date,
							return_acceptance_period: pkg.return_acceptance_period,
							discount: pkg.discount,
							total_tax_amount: pkg.total_tax_amount,
							constant_price: pkg.constant_price,
							images: images.map((img: any) => ({
								id: img.id,
								image_url: img.image_url,
							})),
							hours: viatorHours, // From Viator API
							unavailable_dates: viatorUnavailableDates, // From Viator API
							opportunities: [], // Not available in Viator
							features: [], // Package features not available in Viator
							price: price
								? {
										id: price.id,
										main_price: price.main_price,
										child_price: price.child_price,
										start_date: price.start_date,
										end_date: price.end_date,
										currency: {
											name: price.currency_name,
											code: price.currency_code,
											symbol: price.currency_symbol,
										},
									}
								: null,
						}
					})

					// Build galleries from DB
					const galleries = dbGalleries.map((g: any) => ({
						id: g.id,
						image_url: g.image_url,
						image_type: g.image_type,
						category: g.category,
					}))

					// Build response in the same format as main type
					const responseData = {
						id: activityData.id,
						type: "viator",
						title: activityData.title,
						general_info: activityData.general_info,
						activity_info: activityData.activity_info,
						refund_policy: activityData.refund_policy,
						activity_type_name: activityData.activity_type_name,
						country_name: activityData.country_name,
						city_name: activityData.city_name,
						duration: activityData.duration,
						average_rating: activityData.average_rating,
						comment_count: activityData.comment_count,
						map_location: activityData.map_location,
						approval_period: activityData.approval_period,
						about_to_run_out: activityData.about_to_run_out,
						free_purchase: activityData.free_purchase,
						created_at: activityData.created_at,
						updated_at: activityData.updated_at,
						packages,
						galleries,
						features: viatorFeatures, // From Viator API inclusions
						comments: [],
					}

					return res.status(200).send({
						success: true,
						message: "Activity retrieved successfully",
						data: responseData,
					})
				} catch (viatorErr: any) {
					console.error("Viator API error:", viatorErr.message)
					return res.status(500).send({
						success: false,
						message: "Failed to fetch Viator product details",
					})
				}
			} else {
				return this.show(req, res)
			}
		} catch (error) {
			console.error("Activity v2_show error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve activity",
			})
		}
	}
}
