import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import CarTypeModel from "@/models/CarTypeModel"
import GearTypeModel from "@/models/GearTypeModel"

export default class car_rentalController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language

			const { location_id, page = 1, limit = 5, guest_rating, arrangement, isAvailable, min_price, max_price, type, gear_type } = req.query as any

			const countQuery = knex("car_rentals")
				.innerJoin("car_rental_pivots", "car_rentals.id", "car_rental_pivots.car_rental_id")
				// .where("car_rentals.status", true)
				// .where("car_rentals.admin_approval", true)

				.whereNull("car_rentals.deleted_at")
				.where("car_rental_pivots.language_code", language)
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("car_rentals.location_id", location_id)
					}
					if (guest_rating) {
						queryBuilder.where("car_rentals.average_rating", ">=", guest_rating)
					}
					if (type) {
						queryBuilder.where("car_rentals.car_type_id", type)
					}
					if (gear_type) {
						queryBuilder.where("car_rentals.gear_type_id", gear_type)
					}
				})
				.groupBy("car_rentals.id")
				.countDistinct("car_rentals.id as total")

			let car_rentals = await knex("car_rentals")
				.whereNull("car_rentals.deleted_at")
				// .where("car_rentals.status", true)
				// .where("car_rentals.admin_approval", true)
				.innerJoin("car_rental_pivots", function () {
					this.on("car_rentals.id", "car_rental_pivots.car_rental_id").andOn("car_rental_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("cities", "car_rentals.location_id", "cities.id")
				.innerJoin("gear_type_pivots", function () {
					this.on("car_rentals.gear_type_id", "gear_type_pivots.gear_type_id").andOn("gear_type_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("car_type_pivots", function () {
					this.on("car_rentals.car_type_id", "car_type_pivots.car_type_id").andOn("car_type_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("country_pivots", function () {
					this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("city_pivots", function () {
					this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
				})
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("car_rentals.location_id", location_id)
					}
				})
				.limit(limit)
				.offset((page - 1) * limit)
				.select(
					"car_rentals.id",
					"car_rental_pivots.title",
					"country_pivots.name as country_name",
					"city_pivots.name as city_name",
					"city_pivots.city_id as location_id",
					"country_pivots.country_id as country_id",
					"car_rentals.car_type_id",
					"car_rentals.gear_type_id",
					"car_rentals.user_count",
					"car_rentals.door_count",
					"car_rentals.age_limit",
					"car_rentals.air_conditioning",
					"car_rentals.about_to_run_out",
					"car_rentals.average_rating",
					"car_type_pivots.name as car_type_name",
					"gear_type_pivots.name as gear_type_name",
					"car_rentals.comment_count"
				)

			// Get all car_rental packages for all car_rentals in one query
			const car_rentalIds = car_rentals.map((car_rental: any) => car_rental.id)

			// Get all car_rental packages for all car_rentals in one query
			const allcar_rentalPackages = await knex("car_rental_packages")
				.whereIn("car_rental_packages.car_rental_id", car_rentalIds)
				.innerJoin("car_rental_package_pivots", "car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
				.where("car_rental_package_pivots.language_code", language)
				.whereNull("car_rental_packages.deleted_at")
				.select("car_rental_packages.id", "car_rental_packages.car_rental_id", "car_rental_package_pivots.name", "return_acceptance_period", "discount", "total_tax_amount", "constant_price")

			// Group car_rental packages by car_rental_id
			const car_rentalPackagesBycar_rentalId = allcar_rentalPackages.reduce((acc: Record<string, any[]>, pkg: any) => {
				if (!acc[pkg.car_rental_id]) {
					acc[pkg.car_rental_id] = []
				}
				acc[pkg.car_rental_id].push(pkg)
				return acc
			}, {} as Record<string, any[]>)

			// Assign car_rental packages to car_rentals
			car_rentals.forEach((car_rental: any) => {
				car_rental.car_rental_packages = car_rentalPackagesBycar_rentalId[car_rental.id] || []
			})

			// Get all car_rental package prices in one query
			const allcar_rentalPackageIds = allcar_rentalPackages.map((pkg: any) => pkg.id)
			const allcar_rentalPackagePrices = await knex("car_rental_package_prices")
				.whereIn("car_rental_package_prices.car_rental_package_id", allcar_rentalPackageIds)
				.innerJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
				.innerJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", language)
				.whereNull("car_rental_package_prices.deleted_at")
				.select("car_rental_package_prices.id", "car_rental_package_prices.car_rental_package_id", "car_rental_package_prices.main_price", "car_rental_package_prices.child_price", "car_rental_package_prices.currency_id", "currency_pivots.name", "currencies.code", "currencies.symbol")

			// Group prices by car_rental_package_id (only keep the first price for each package)
			const pricesByPackageId = allcar_rentalPackagePrices.reduce((acc: Record<string, any>, price: any) => {
				if (!acc[price.car_rental_package_id]) {
					acc[price.car_rental_package_id] = price
				}
				return acc
			}, {} as Record<string, any>)

			// Assign prices to car_rental packages
			car_rentals.forEach((car_rental: any) => {
				if (car_rental.car_rental_packages) {
					// Assign prices to car_rental packages
					car_rental.car_rental_packages.forEach((car_rentalPackage: any) => {
						car_rentalPackage.car_rental_package_price = pricesByPackageId[car_rentalPackage.id] || null
					})

					// Find the car_rental package with the lowest main_price
					const cheapestPackage = car_rental.car_rental_packages.reduce((lowest: any, current: any) => {
						const lowestPrice = lowest?.car_rental_package_price?.main_price ?? Infinity
						const currentPrice = current?.car_rental_package_price?.main_price ?? Infinity

						return currentPrice < lowestPrice ? current : lowest
					}, null)

					// Keep only the cheapest package
					car_rental.car_rental_packages = cheapestPackage ? cheapestPackage : null

					let totalPrice = 0
					// Note: baby_price column doesn't exist in car_rental_package_prices table

					totalPrice += car_rental.car_rental_packages.car_rental_package_price.main_price * 1
					car_rental.total_price = totalPrice
				}
			})

			if (isAvailable) {
				car_rentals = car_rentals.filter((car_rental: any) => car_rental.car_rental_packages && car_rental.car_rental_packages.car_rental_package_price && car_rental.car_rental_packages.car_rental_package_price.main_price > 0)
			}

			if (min_price) {
				car_rentals = car_rentals.filter((car_rental: any) => (car_rental.total_price || 0) >= min_price)
			}
			if (max_price) {
				car_rentals = car_rentals.filter((car_rental: any) => (car_rental.total_price || 0) <= max_price)
			}

			if (arrangement === "price_increasing") {
				car_rentals.sort((a: any, b: any) => (a.total_price || 0) - (b.total_price || 0))
			} else if (arrangement === "price_decreasing") {
				car_rentals.sort((a: any, b: any) => (b.total_price || 0) - (a.total_price || 0))
			} else if (arrangement === "star_increasing") {
				car_rentals.sort((a: any, b: any) => 0)
			} else if (arrangement === "star_decreasing") {
				car_rentals.sort((a: any, b: any) => 0)
			} else if (arrangement === "rating_increasing") {
				car_rentals.sort((a: any, b: any) => a.average_rating - b.average_rating)
			} else if (arrangement === "rating_decreasing") {
				car_rentals.sort((a: any, b: any) => b.average_rating - a.average_rating)
			}

			const total = await countQuery.first()
			const totalPages = Math.ceil(total?.total ?? 0 / Number(limit))
			return res.status(200).send({
				success: true,
				message: "car_rentals fetched successfully",
				data: car_rentals,
				total: Number(total?.total),
				totalPages: totalPages,
			})
		} catch (error) {
			console.error("car_rentals error:", error)
			return res.status(500).send({
				success: false,
				message: "car_rentals fetch failed",
			})
		}
	}

	async carTypes(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language ?? "en"
			const carTypeModel = new CarTypeModel()
			const carTypes = await carTypeModel.getPivots(language)
			return res.status(200).send({
				success: true,
				message: "car_types fetched successfully",
				data: carTypes,
			})
		} catch (error) {
			console.error("car_types error:", error)
			return res.status(500).send({
				success: false,
				message: "car_types fetch failed",
			})
		}
	}

	async gearTypes(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language ?? "en"
			const gearTypeModel = new GearTypeModel()
			const gearTypes = await gearTypeModel.getPivots(language)
			return res.status(200).send({
				success: true,
				message: "gear_types fetched successfully",
				data: gearTypes,
			})
		} catch (error) {
			console.log(error)
			return res.status(500).send({
				success: false,
				message: "gear_types fetch failed",
			})
		}
	}
	async show(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as any
			const language = (req as any).language

			// Tek sorguda tüm veriyi çek
			const results = await knex("car_rentals")
				.where("car_rentals.id", id)
				.whereNull("car_rentals.deleted_at")

				// CarRental bilgileri
				.innerJoin("car_rental_pivots", function () {
					this.on("car_rentals.id", "car_rental_pivots.car_rental_id").andOn("car_rental_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("car_rental_pivots.deleted_at")

				// Car Type bilgileri
				.leftJoin("car_type_pivots", function () {
					this.on("car_rentals.car_type_id", "car_type_pivots.car_type_id").andOn("car_type_pivots.language_code", knex.raw("?", [language]))
				})

				// Gear Type bilgileri
				.leftJoin("gear_type_pivots", function () {
					this.on("car_rentals.gear_type_id", "gear_type_pivots.gear_type_id").andOn("gear_type_pivots.language_code", knex.raw("?", [language]))
				})

				// Şehir ve ülke bilgileri
				.innerJoin("cities", "car_rentals.location_id", "cities.id")
				.innerJoin("country_pivots", function () {
					this.on("cities.country_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("country_pivots.deleted_at")
				.innerJoin("city_pivots", function () {
					this.on("cities.id", "city_pivots.city_id").andOn("city_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("city_pivots.deleted_at")

				// Gallery bilgileri
				.leftJoin("car_rental_galleries", "car_rentals.id", "car_rental_galleries.car_rental_id")
				.leftJoin("car_rental_gallery_pivots", function () {
					this.on("car_rental_galleries.id", "car_rental_gallery_pivots.car_rental_gallery_id")
						.andOn("car_rental_gallery_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("car_rental_galleries.deleted_at")
						.andOnNull("car_rental_gallery_pivots.deleted_at")
				})

				// CarRental özellikleri
				.leftJoin("car_rental_features", "car_rentals.id", "car_rental_features.car_rental_id")
				.leftJoin("car_rental_feature_pivots", function () {
					this.on("car_rental_features.id", "car_rental_feature_pivots.car_rental_feature_id")
						.andOn("car_rental_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("car_rental_features.deleted_at")
						.andOnNull("car_rental_feature_pivots.deleted_at")
				})

				// Paket bilgileri
				.leftJoin("car_rental_packages", "car_rentals.id", "car_rental_packages.car_rental_id")
				.leftJoin("car_rental_package_pivots", function () {
					this.on("car_rental_packages.id", "car_rental_package_pivots.car_rental_package_id")
						.andOn("car_rental_package_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("car_rental_packages.deleted_at")
						.andOnNull("car_rental_package_pivots.deleted_at")
				})

				// Paket fiyatları
				.leftJoin("car_rental_package_prices", function () {
					this.on("car_rental_packages.id", "car_rental_package_prices.car_rental_package_id").andOnNull("car_rental_package_prices.deleted_at")
				})

				// Para birimi bilgileri
				.leftJoin("currencies", "car_rental_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function () {
					this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
				})
				// Paket resimleri - YENİ EKLENEN
				.leftJoin("car_rental_package_images", function () {
					this.on("car_rental_packages.id", "car_rental_package_images.car_rental_package_id").andOnNull("car_rental_package_images.deleted_at")
				})

				// Paket özellikleri
				.leftJoin("car_rental_package_features", "car_rental_packages.id", "car_rental_package_features.car_rental_package_id")
				.leftJoin("car_rental_package_feature_pivots", function () {
					this.on("car_rental_package_features.id", "car_rental_package_feature_pivots.car_rental_package_feature_id")
						.andOn("car_rental_package_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("car_rental_package_features.deleted_at")
						.andOnNull("car_rental_package_feature_pivots.deleted_at")
				})

				// Pickup/Delivery noktaları
				.leftJoin("car_pickup_delivery", "car_rentals.id", "car_pickup_delivery.car_rental_id")
				.leftJoin("stations", "car_pickup_delivery.station_id", "stations.id")
				.leftJoin("station_pivots", function () {
					this.on("stations.id", "station_pivots.station_id")
						.andOn("station_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("car_pickup_delivery.deleted_at")
						.andOnNull("stations.deleted_at")
						.andOnNull("station_pivots.deleted_at")
				})

				.select(
					// CarRental bilgileri
					"car_rentals.*",
					"car_rental_pivots.title as car_rental_title",
					"car_rental_pivots.general_info",
					"car_rental_pivots.car_info",
					"car_rental_pivots.refund_policy as car_rental_refund_policy",

					// Car Type ve Gear Type bilgileri
					"car_type_pivots.name as car_type_name",
					"gear_type_pivots.name as gear_type_name",

					// Lokasyon bilgileri
					"country_pivots.name as country_name",
					"city_pivots.name as city_name",

					// Gallery bilgileri
					"car_rental_galleries.id as gallery_id",
					"car_rental_galleries.image_url as gallery_image_url",
					"car_rental_galleries.image_type as gallery_image_type",
					"car_rental_gallery_pivots.category as gallery_category",

					// CarRental features
					"car_rental_features.id as feature_id",
					"car_rental_features.status as feature_status",
					"car_rental_feature_pivots.name as feature_name",

					// Paket bilgileri
					"car_rental_packages.id as package_id",
					"car_rental_package_pivots.name as package_name",
					"car_rental_package_pivots.description as package_description",
					"car_rental_package_pivots.refund_policy as package_refund_policy",
					"car_rental_packages.return_acceptance_period",
					"car_rental_packages.discount",
					"car_rental_packages.total_tax_amount",
					"car_rental_packages.constant_price",

					// Paket fiyatları
					"car_rental_package_prices.id as price_id",
					"car_rental_package_prices.main_price",
					"car_rental_package_prices.child_price",

					"car_rental_package_prices.start_date",
					"car_rental_package_prices.end_date",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",

					// Paket resimleri
					"car_rental_package_images.id as package_image_id",
					"car_rental_package_images.image_url as package_image_url",

					// Paket özellikleri
					"car_rental_package_features.id as package_feature_id",
					"car_rental_package_features.status as package_feature_status",
					"car_rental_package_feature_pivots.name as package_feature_name",

					// Pickup/Delivery noktaları
					"car_pickup_delivery.id as pickup_delivery_id",
					"car_pickup_delivery.status as pickup_delivery_status",
					"station_pivots.name as station_name"
				)

			if (results.length === 0) {
				return res.status(404).send({
					success: false,
					message: "Car rental not found",
				})
			}

			// İlk satırdan car rental bilgilerini al
			const firstRow = results[0]
			const carRental = {
				id: firstRow.id,
				title: firstRow.car_rental_title,
				general_info: firstRow.general_info,
				car_info: firstRow.car_info,
				refund_policy: firstRow.car_rental_refund_policy,
				car_type_name: firstRow.car_type_name,
				gear_type_name: firstRow.gear_type_name,
				country_name: firstRow.country_name,
				city_name: firstRow.city_name,
				user_count: firstRow.user_count,
				door_count: firstRow.door_count,
				age_limit: firstRow.age_limit,
				air_conditioning: firstRow.air_conditioning,
				about_to_run_out: firstRow.about_to_run_out,
				average_rating: firstRow.average_rating,
				comment_count: firstRow.comment_count,
				created_at: firstRow.created_at,
				updated_at: firstRow.updated_at,
				packages: [],
				galleries: [],
				features: [],
				pickup_delivery_points: [],
			}

			// Paketleri grupla (Activity ile aynı mantık)
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
						features: [],
						images: [],
						selectedPrice: null,
					})
				}

				const packageData = packageMap.get(row.package_id)

				if (row.package_image_id) {
					const existingImage = packageData.images.find((img: any) => img.id === row.package_image_id)
					if (!existingImage) {
						packageData.images.push({
							id: row.package_image_id,
							image_url: row.package_image_url,
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

				// Paket fiyatları (Hotel mantığı
				if (row.price_id && !packageData.selectedPrice) {
					let selectedPrice = null

					if (row.constant_price) {
						// Sabit fiyat ise herhangi bir fiyat al
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
						// Sabit fiyat değilse şu anki tarihe göre fiyat bul
						if (row.start_date && row.end_date) {
							const startDate = new Date(row.start_date)
							const endDate = new Date(row.end_date)

							if (now >= startDate && now <= endDate) {
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
					}

					if (selectedPrice) {
						packageData.selectedPrice = selectedPrice
					}
				}
			})

			carRental.packages = Array.from(packageMap.values()).map((pkg: any) => ({
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

			carRental.galleries = Array.from(galleryMap.values()) as any

			// CarRental özelliklerini grupla
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

			carRental.features = Array.from(featureMap.values()) as any

			// Pickup/Delivery noktalarını grupla
			const pickupDeliveryMap = new Map()

			results.forEach((row: any) => {
				if (!row.pickup_delivery_id) return

				if (!pickupDeliveryMap.has(row.pickup_delivery_id)) {
					pickupDeliveryMap.set(row.pickup_delivery_id, {
						id: row.pickup_delivery_id,
						station_name: row.station_name,
						status: row.pickup_delivery_status,
					})
				}
			})

			carRental.pickup_delivery_points = Array.from(pickupDeliveryMap.values()) as any

			return res.status(200).send({
				success: true,
				message: "Car rental retrieved successfully",
				data: carRental,
			})
		} catch (error) {
			console.error("Car rental show error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve car rental",
			})
		}
	}
}
