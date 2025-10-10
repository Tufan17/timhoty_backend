import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import TourModel from "@/models/TourModel"

export default class TourController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language

			const { location_id, page = 1, limit = 5, guest_rating, arrangement, isAvailable, min_price, max_price, period, departure_point_id } = req.query as any

			// Toplam sayıyı al (groupBy olmadan)
			const countResult = await knex("tours")
				.innerJoin("tour_pivots", "tours.id", "tour_pivots.tour_id")
				.where("tours.status", true)
				.where("tours.admin_approval", true)
				.whereNull("tours.deleted_at")
				.where("tour_pivots.language_code", language)
				.leftJoin(
					knex.raw(
						`LATERAL (
									SELECT tg.image_url
									FROM tour_galleries tg
									LEFT JOIN tour_gallery_pivots tgp ON tg.id = tgp.tour_gallery_id
									WHERE tg.tour_id = tours.id
									AND tg.deleted_at IS NULL
									AND tgp.category = 'Kapak Resmi'
									AND tgp.deleted_at IS NULL
									ORDER BY tg.created_at ASC
									LIMIT 1
							) AS tour_gallery ON true`
					)
				)
				.whereNotNull("tour_gallery.image_url")

				.modify(function (queryBuilder) {
					if (guest_rating) {
						queryBuilder.where("tours.average_rating", ">=", guest_rating)
					}
					if (departure_point_id) {
						// Sadece belirtilen başlangıç noktasına sahip turları filtrele
						queryBuilder.whereIn("tours.id", function () {
							this.select("tour_id").from("tour_departure_points").where("location_id", departure_point_id).whereNull("deleted_at")
						})
					}
				})
				.countDistinct("tours.id as total")
				.first()

			const total = Number(countResult?.total ?? 0)
			const totalPages = Math.ceil(total / limit)

			// Tours ve ilk fotoğrafı tek sorguda al (LATERAL JOIN ile)
			const tours = await knex("tours")
				.innerJoin("tour_pivots", function () {
					this.on("tours.id", "tour_pivots.tour_id").andOn("tour_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("tour_pivots.deleted_at")
				.where("tours.status", true)
				.where("tours.admin_approval", true)
				.whereNull("tours.deleted_at")
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.whereIn("tours.id", function () {
							this.select("tour_id").from("tour_locations").where("location_id", location_id).whereNull("deleted_at")
						})
					}
					if (guest_rating) {
						queryBuilder.where("tours.average_rating", ">=", guest_rating)
					}
					if (departure_point_id) {
						queryBuilder.whereIn("tours.id", function () {
							this.select("tour_id").from("tour_departure_points").where("location_id", departure_point_id).whereNull("deleted_at")
						})
					}
				})
				.leftJoin(
					knex.raw(
						`LATERAL (
                SELECT tg.image_url
                FROM tour_galleries tg
                LEFT JOIN tour_gallery_pivots tgp ON tg.id = tgp.tour_gallery_id
                WHERE tg.tour_id = tours.id
                AND tg.deleted_at IS NULL
                AND tgp.category = 'Kapak Resmi'
                AND tgp.deleted_at IS NULL
                ORDER BY tg.created_at ASC
                LIMIT 1
            ) AS tour_gallery ON true`
					)
				)

				.modify(function (queryBuilder) {
					if (period) {
						queryBuilder
							.leftJoin(
								knex.raw(
									`LATERAL (
                            SELECT
                                CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END as has_period_package
                            FROM tour_packages tp
                            INNER JOIN tour_package_prices tpp ON tp.id = tpp.tour_package_id
                            WHERE tp.tour_id = tours.id
                            AND tp.deleted_at IS NULL
                            AND tpp.deleted_at IS NULL
                            AND tpp.period = ?
                        ) AS period_check ON true`,
									[period]
								)
							)
							.orderBy("period_check.has_period_package", "desc")
					}
				})
				.whereNotNull("tour_gallery.image_url")
				.limit(limit)
				.offset((page - 1) * limit)
				.select("tours.id", "tours.average_rating", "tours.comment_count", "tours.refund_days", "tours.night_count", "tours.day_count", "tours.user_count", "tour_pivots.title as title", "tour_gallery.image_url")

			// Tüm tour'ların başlangıç noktalarını tek sorguda al
			if (tours.length > 0) {
				const tourIds = tours.map((tour: any) => tour.id)
				const allDeparturePoints = await knex("tour_departure_points")
					.whereIn("tour_departure_points.tour_id", tourIds)
					.whereNull("tour_departure_points.deleted_at")
					.innerJoin("cities", "tour_departure_points.location_id", "cities.id")
					.innerJoin("city_pivots", function () {
						this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
					})
					.whereNull("city_pivots.deleted_at")
					.innerJoin("country_pivots", function () {
						this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
					})
					.whereNull("country_pivots.deleted_at")
					.select("tour_departure_points.id", "tour_departure_points.tour_id", "tour_departure_points.location_id as departure_point_id", "city_pivots.name as city_name", "country_pivots.name as country_name", "country_pivots.country_id as country_id")
				const allLocations = await knex("tour_locations")
					.whereIn("tour_locations.tour_id", tourIds)
					.whereNull("tour_locations.deleted_at")
					.innerJoin("cities", "tour_locations.location_id", "cities.id")
					.innerJoin("city_pivots", function () {
						this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
					})
					.whereNull("city_pivots.deleted_at")
					.innerJoin("country_pivots", function () {
						this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
					})
					.whereNull("country_pivots.deleted_at")
					.select("tour_locations.id", "tour_locations.tour_id", "tour_locations.location_id", "city_pivots.name as city_name", "country_pivots.name as country_name", "country_pivots.country_id as country_id")

				// Başlangıç noktalarını tour_id'ye göre grupla
				const departurePointsByTourId = allDeparturePoints.reduce((acc: Record<string, any[]>, point: any) => {
					if (!acc[point.tour_id]) {
						acc[point.tour_id] = []
					}
					acc[point.tour_id].push({
						id: point.id,
						departure_point_id: point.departure_point_id,
						city_name: point.city_name,
						country_name: point.country_name,
						country_id: point.country_id,
					})
					return acc
				}, {} as Record<string, any[]>)

				// Lokasyonları tour_id'ye göre grupla
				const locationsByTourId = allLocations.reduce((acc: Record<string, any[]>, location: any) => {
					if (!acc[location.tour_id]) {
						acc[location.tour_id] = []
					}
					acc[location.tour_id].push({
						id: location.id,
						location_id: location.location_id,
						city_name: location.city_name,
						country_name: location.country_name,
						country_id: location.country_id,
					})
					return acc
				}, {} as Record<string, any[]>)

				// Başlangıç noktalarını ve lokasyonları tours'a ekle
				tours.forEach((tour: any) => {
					tour.tour_departure_points = departurePointsByTourId[tour.id] || []
					tour.tour_locations = locationsByTourId[tour.id] || []
				})

				// Tüm tour'ların paketlerini ve fiyatlarını tek sorguda al
				const allTourPackages = await knex("tour_packages")
					.whereIn("tour_packages.tour_id", tourIds)
					.whereNull("tour_packages.deleted_at")
					.innerJoin("tour_package_pivots", function () {
						this.on("tour_packages.id", "tour_package_pivots.tour_package_id").andOn("tour_package_pivots.language_code", knex.raw("?", [language]))
					})
					.whereNull("tour_package_pivots.deleted_at")
					.select("tour_packages.id", "tour_packages.tour_id", "tour_packages.constant_price", "tour_packages.date", "tour_package_pivots.name", "tour_packages.discount")

				// Tüm paket fiyatlarını tek sorguda al
				if (allTourPackages.length > 0) {
					const packageIds = allTourPackages.map((pkg: any) => pkg.id)
					const now = new Date()

					const allPackagePrices = await knex("tour_package_prices")
						.whereIn("tour_package_prices.tour_package_id", packageIds)
						.whereNull("tour_package_prices.deleted_at")
						.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
						.leftJoin("currency_pivots", function () {
							this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
						})
						.modify(function (queryBuilder) {
							if (period) {
								queryBuilder.where("tour_package_prices.period", period)
							}
						})
						.select("tour_package_prices.id", "tour_package_prices.tour_package_id", "tour_package_prices.main_price", "tour_package_prices.child_price", "tour_package_prices.baby_price", "tour_package_prices.start_date", "tour_package_prices.end_date", "tour_package_prices.period", "currencies.code as currency_code", "currencies.symbol as currency_symbol", "currency_pivots.name as currency_name")

					// Her paket için uygun fiyatı bul (constant_price veya tarihe göre)
					const packagePriceMap: Record<string, any> = {}
					allTourPackages.forEach((pkg: any) => {
						const prices = allPackagePrices.filter((price: any) => price.tour_package_id === pkg.id)

						if (prices.length > 0) {
							let selectedPrice = null

							if (pkg.constant_price) {
								// Sabit fiyat ise ilk fiyatı al
								selectedPrice = prices[0]
							} else {
								// Tarih aralığına göre uygun fiyatı bul
								selectedPrice =
									prices.find((price: any) => {
										if (price.start_date && price.end_date) {
											const startDate = new Date(price.start_date)
											const endDate = new Date(price.end_date)
											return now >= startDate && now <= endDate
										}
										return true
									}) || prices[0]
							}

							if (selectedPrice) {
								packagePriceMap[pkg.id] = {
									package_id: pkg.id,
									package_name: pkg.name,
									discount: pkg.discount,
									date: pkg.date,
									main_price: selectedPrice.main_price,
									child_price: selectedPrice.child_price,
									baby_price: selectedPrice.baby_price,
									period: selectedPrice.period,
									currency_code: selectedPrice.currency_code,
									currency_symbol: selectedPrice.currency_symbol,
									currency_name: selectedPrice.currency_name,
								}
							}
						}
					})

					// Her tour için en ucuz paketi bul
					tours.forEach((tour: any) => {
						const tourPackages = allTourPackages.filter((pkg: any) => pkg.tour_id === tour.id)
						let cheapestPackage: any = null
						let lowestPrice = Infinity

						tourPackages.forEach((pkg: any) => {
							const priceInfo = packagePriceMap[pkg.id]
							if (priceInfo && priceInfo.main_price < lowestPrice) {
								lowestPrice = priceInfo.main_price
								cheapestPackage = priceInfo
							}
						})

						tour.tour_packages = cheapestPackage
						tour.total_price = lowestPrice !== Infinity ? lowestPrice : 0

						// Para birimi bilgilerini tour seviyesinde de ekle
						if (cheapestPackage) {
							tour.currency_symbol = cheapestPackage.currency_symbol
							tour.currency_code = cheapestPackage.currency_code
							tour.currency_name = cheapestPackage.currency_name
						} else {
							tour.currency_symbol = null
							tour.currency_code = null
							tour.currency_name = null
						}
					})
				} else {
					// Paket bulunamazsa tüm turlara default değerler ata
					tours.forEach((tour: any) => {
						tour.tour_packages = null
						tour.total_price = 0
						tour.currency_symbol = null
						tour.currency_code = null
						tour.currency_name = null
					})
				}
			}

			// Fiyat filtrelemeleri uygula
			let filteredTours = tours

			if (isAvailable) {
				filteredTours = filteredTours.filter((tour: any) => tour.total_price > 0)
			}

			if (min_price) {
				filteredTours = filteredTours.filter((tour: any) => tour.total_price >= Number(min_price))
			}

			if (max_price) {
				filteredTours = filteredTours.filter((tour: any) => tour.total_price <= Number(max_price))
			}

			// Sıralama uygula
			if (arrangement === "price_increasing") {
				filteredTours.sort((a: any, b: any) => a.total_price - b.total_price)
			} else if (arrangement === "price_decreasing") {
				filteredTours.sort((a: any, b: any) => b.total_price - a.total_price)
			} else if (arrangement === "rating_increasing") {
				filteredTours.sort((a: any, b: any) => a.average_rating - b.average_rating)
			} else if (arrangement === "rating_decreasing") {
				filteredTours.sort((a: any, b: any) => b.average_rating - a.average_rating)
			}

			return res.status(200).send({
				success: true,
				message: "Tours fetched successfully",
				data: filteredTours,
				limit: limit,
				total: total,
				currentPage: Number(page),
				totalPages: totalPages,
			})
		} catch (error) {
			console.error("Tours error:", error)
			return res.status(500).send({
				success: false,
				message: "Tours fetch failed",
			})
		}
	}
	async show(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as any
			const language = (req as any).language

			// Tek sorguda tüm veriyi çek - LEFT JOIN kullanarak
			const results = await knex("tours")
				.where("tours.id", id)
				.whereNull("tours.deleted_at")

				// Tour bilgileri
				.innerJoin("tour_pivots", function () {
					this.on("tours.id", "tour_pivots.tour_id").andOn("tour_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("tour_pivots.deleted_at")

				// Lokasyon bilgileri (tour_locations üzerinden)
				.leftJoin("tour_locations", function () {
					this.on("tours.id", "tour_locations.tour_id").andOnNull("tour_locations.deleted_at")
				})
				.leftJoin("cities as location_cities", "tour_locations.location_id", "location_cities.id")
				.leftJoin("city_pivots as location_city_pivots", function () {
					this.on("location_cities.id", "location_city_pivots.city_id").andOn("location_city_pivots.language_code", knex.raw("?", [language]))
				})
				.leftJoin("country_pivots as location_country_pivots", function () {
					this.on("location_cities.country_id", "location_country_pivots.country_id").andOn("location_country_pivots.language_code", knex.raw("?", [language]))
				})

				// Kalkış noktaları
				.leftJoin("tour_departure_points", function () {
					this.on("tours.id", "tour_departure_points.tour_id").andOnNull("tour_departure_points.deleted_at")
				})
				.leftJoin("cities as departure_cities", "tour_departure_points.location_id", "departure_cities.id")
				.leftJoin("city_pivots as departure_city_pivots", function () {
					this.on("departure_cities.id", "departure_city_pivots.city_id").andOn("departure_city_pivots.language_code", knex.raw("?", [language]))
				})
				.leftJoin("country_pivots as departure_country_pivots", function () {
					this.on("departure_cities.country_id", "departure_country_pivots.country_id").andOn("departure_country_pivots.language_code", knex.raw("?", [language]))
				})

				// Gallery bilgileri
				.leftJoin("tour_galleries", function () {
					this.on("tours.id", "tour_galleries.tour_id").andOnNull("tour_galleries.deleted_at")
				})
				.leftJoin("tour_gallery_pivots", function () {
					this.on("tour_galleries.id", "tour_gallery_pivots.tour_gallery_id")
						.andOn("tour_gallery_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_gallery_pivots.deleted_at")
				})

				// Tour özellikleri
				.leftJoin("tour_features", function () {
					this.on("tours.id", "tour_features.tour_id").andOnNull("tour_features.deleted_at")
				})
				.leftJoin("tour_feature_pivots", function () {
					this.on("tour_features.id", "tour_feature_pivots.tour_feature_id")
						.andOn("tour_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_feature_pivots.deleted_at")
				})

				// Paket bilgileri
				.leftJoin("tour_packages", function () {
					this.on("tours.id", "tour_packages.tour_id").andOnNull("tour_packages.deleted_at")
				})
				.leftJoin("tour_package_pivots", function () {
					this.on("tour_packages.id", "tour_package_pivots.tour_package_id")
						.andOn("tour_package_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_package_pivots.deleted_at")
				})

				// Paket fiyatları
				.leftJoin("tour_package_prices", function () {
					this.on("tour_packages.id", "tour_package_prices.tour_package_id").andOnNull("tour_package_prices.deleted_at")
				})

				// Para birimi bilgileri
				.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function () {
					this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
				})

				// Paket resimleri
				.leftJoin("tour_package_images", function () {
					this.on("tour_packages.id", "tour_package_images.tour_package_id").andOnNull("tour_package_images.deleted_at")
				})

				// Paket olanakları
				.leftJoin("tour_package_opportunities", function () {
					this.on("tour_packages.id", "tour_package_opportunities.tour_package_id").andOnNull("tour_package_opportunities.deleted_at")
				})
				.leftJoin("tour_package_opportunity_pivots", function () {
					this.on("tour_package_opportunities.id", "tour_package_opportunity_pivots.tour_package_opportunity_id")
						.andOn("tour_package_opportunity_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_package_opportunity_pivots.deleted_at")
				})

				// Paket özellikleri
				.leftJoin("tour_package_features", function () {
					this.on("tour_packages.id", "tour_package_features.tour_package_id").andOnNull("tour_package_features.deleted_at")
				})
				.leftJoin("tour_package_feature_pivots", function () {
					this.on("tour_package_features.id", "tour_package_feature_pivots.tour_package_feature_id")
						.andOn("tour_package_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_package_feature_pivots.deleted_at")
				})

				// Tour programları
				.leftJoin("tour_programs", function () {
					this.on("tours.id", "tour_programs.tour_id").andOnNull("tour_programs.deleted_at")
				})
				.leftJoin("tour_program_pivots", function () {
					this.on("tour_programs.id", "tour_program_pivots.tour_program_id")
						.andOn("tour_program_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("tour_program_pivots.deleted_at")
				})

				.select(
					// Tour bilgileri
					"tours.*",
					"tour_pivots.title as tour_title",
					"tour_pivots.general_info",
					"tour_pivots.tour_info",
					"tour_pivots.refund_policy as tour_refund_policy",

					// Lokasyon bilgileri
					"tour_locations.id as tour_location_id",
					"tour_locations.location_id",
					"location_city_pivots.name as location_city_name",
					"location_country_pivots.name as location_country_name",
					"location_country_pivots.country_id as location_country_id",

					// Kalkış noktaları
					"tour_departure_points.id as departure_point_id",
					"departure_city_pivots.name as departure_city_name",
					"departure_country_pivots.name as departure_country_name",
					"departure_country_pivots.country_id as departure_country_id",

					// Gallery bilgileri
					"tour_galleries.id as gallery_id",
					"tour_galleries.image_url as gallery_image_url",
					"tour_galleries.image_type as gallery_image_type",
					"tour_gallery_pivots.category as gallery_category",

					// Tour features
					"tour_features.id as feature_id",
					"tour_features.status as feature_status",
					"tour_feature_pivots.name as feature_name",

					// Paket bilgileri
					"tour_packages.id as package_id",
					"tour_package_pivots.name as package_name",
					"tour_package_pivots.description as package_description",
					"tour_package_pivots.refund_policy as package_refund_policy",
					"tour_packages.return_acceptance_period",
					"tour_packages.discount",
					"tour_packages.total_tax_amount",
					"tour_packages.constant_price",
					"tour_packages.date",

					// Paket fiyatları
					"tour_package_prices.id as price_id",
					"tour_package_prices.main_price",
					"tour_package_prices.child_price",
					"tour_package_prices.baby_price",
					"tour_package_prices.start_date",
					"tour_package_prices.end_date",
					"tour_package_prices.period",
					"tour_package_prices.quota",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",

					// Paket resimleri
					"tour_package_images.id as package_image_id",
					"tour_package_images.image_url as package_image_url",

					// Paket olanakları
					"tour_package_opportunities.id as package_opportunity_id",
					"tour_package_opportunity_pivots.name as package_opportunity_name",

					// Paket özellikleri
					"tour_package_features.id as package_feature_id",
					"tour_package_features.status as package_feature_status",
					"tour_package_feature_pivots.name as package_feature_name",

					// Tour programları
					"tour_programs.id as program_id",
					"tour_programs.order as program_order",
					"tour_program_pivots.title as program_title",
					"tour_program_pivots.content as program_content"
				)

			if (results.length === 0) {
				return res.status(404).send({
					success: false,
					message: "Tour not found",
				})
			}

			// İlk satırdan  bilgilerini al
			const firstRow = results[0]
			const tour = {
				id: firstRow.id,
				title: firstRow.tour_title,
				general_info: firstRow.general_info,
				tour_info: firstRow.tour_info,
				refund_policy: firstRow.tour_refund_policy,
				night_count: firstRow.night_count,
				day_count: firstRow.day_count,
				refund_days: firstRow.refund_days,
				user_count: firstRow.user_count,
				average_rating: firstRow.average_rating,
				comment_count: firstRow.comment_count,
				created_at: firstRow.created_at,
				updated_at: firstRow.updated_at,
				packages: [],
				galleries: [],
				features: [],
				locations: [],
				departure_points: [],
				programs: [],
				comments: [],
			}

			// grupla ve yapılandır
			const packageMap = new Map()
			const now = new Date()

			results.forEach((row: any) => {
				if (!row.package_id) return

				if (!packageMap.has(row.package_id)) {
					packageMap.set(row.package_id, {
						id: row.package_id,
						name: row.package_name,
						description: row.package_description,
						refund_policy: row.package_refund_policy,
						return_acceptance_period: row.return_acceptance_period,
						discount: row.discount,
						total_tax_amount: row.total_tax_amount,
						constant_price: row.constant_price,
						date: row.date,
						images: [],
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

				// Paket fiyatları (Hotel mantığı)
				if (row.price_id && !packageData.selectedPrice) {
					let selectedPrice = null

					if (row.constant_price) {
						// Sabit fiyat ise herhangi bir fiyat al
						selectedPrice = {
							id: row.price_id,
							main_price: row.main_price,
							child_price: row.child_price,
							baby_price: row.baby_price,
							period: row.period,
							quota: row.quota,
							start_date: row.start_date,
							end_date: row.end_date,
							currency: {
								name: row.currency_name,
								code: row.currency_code,
								symbol: row.currency_symbol,
							},
						}
					} else {
						// Sabit fiyat değilse
						if (row.start_date && row.end_date) {
							// Tarih aralığı varsa tarih kontrolü yap
							const startDate = new Date(row.start_date)
							const endDate = new Date(row.end_date)

							if (now >= startDate && now <= endDate) {
								selectedPrice = {
									id: row.price_id,
									main_price: row.main_price,
									child_price: row.child_price,
									baby_price: row.baby_price,
									period: row.period,
									quota: row.quota,
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
							// Tarih aralığı yoksa period'a göre veya direkt fiyatı al
							selectedPrice = {
								id: row.price_id,
								main_price: row.main_price,
								child_price: row.child_price,
								baby_price: row.baby_price,
								period: row.period,
								quota: row.quota,
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

			tour.packages = Array.from(packageMap.values()).map((pkg: any) => ({
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

			tour.galleries = Array.from(galleryMap.values()) as any

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

			tour.features = Array.from(featureMap.values()) as any

			// Lokasyonları grupla
			const tourLocationsMap = new Map()
			results.forEach((row: any) => {
				if (!row.tour_location_id) return

				if (!tourLocationsMap.has(row.tour_location_id)) {
					tourLocationsMap.set(row.tour_location_id, {
						id: row.tour_location_id,
						location_id: row.location_id,
						city_name: row.location_city_name,
						country_name: row.location_country_name,
						country_id: row.location_country_id,
					})
				}
			})
			tour.locations = Array.from(tourLocationsMap.values()) as any

			// Kalkış noktalarını grupla
			const tourDeparturePointsMap = new Map()
			results.forEach((row: any) => {
				if (!row.departure_point_id) return

				if (!tourDeparturePointsMap.has(row.departure_point_id)) {
					tourDeparturePointsMap.set(row.departure_point_id, {
						id: row.departure_point_id,
						city_name: row.departure_city_name,
						country_name: row.departure_country_name,
						country_id: row.departure_country_id,
					})
				}
			})
			tour.departure_points = Array.from(tourDeparturePointsMap.values()) as any

			// Programları grupla
			const tourProgramsMap = new Map()
			results.forEach((row: any) => {
				if (!row.program_id) return

				if (!tourProgramsMap.has(row.program_id)) {
					tourProgramsMap.set(row.program_id, {
						id: row.program_id,
						title: row.program_title,
						content: row.program_content,
						order: row.program_order,
					})
				}
			})
			tour.programs = Array.from(tourProgramsMap.values()) as any
			const tourModel = new TourModel()
			const comments = await tourModel.getComments(language, 100, id)
			tour.comments = comments as any
			return res.status(200).send({
				success: true,
				message: "Tour retrieved successfully",
				data: tour,
			})
		} catch (error) {
			console.error("Tour show error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve tour",
			})
		}
	}
}
