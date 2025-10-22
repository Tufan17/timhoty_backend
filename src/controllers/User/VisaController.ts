import { FastifyRequest, FastifyReply } from "fastify"
import knex from "@/db/knex"
import VisaModel from "@/models/VisaModel"

export default class VisaController {
	async index(req: FastifyRequest, res: FastifyReply) {
		try {
			const language = (req as any).language

			const { location_id, page = 1, limit = 5, guest_rating, date, arrangement, min_price, max_price } = req.query as any

			// Count query: get the total number of visas matching the filters
			const countQuery = knex("visas")
				.innerJoin("visa_pivots", "visas.id", "visa_pivots.visa_id")
				.where("visas.status", true)
				.where("visas.admin_approval", true)
				.whereNull("visas.deleted_at")
				.where("visa_pivots.language_code", language)
				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("visas.location_id", location_id)
					}
					if (guest_rating) {
						queryBuilder.where("visas.average_rating", ">=", guest_rating)
					}
				})
				.countDistinct("visas.id as total")

			let visas = await knex("visas")
				.whereNull("visas.deleted_at")
				.where("visas.status", true)
				.where("visas.admin_approval", true)
				.innerJoin("visa_pivots", function () {
					this.on("visas.id", "visa_pivots.visa_id").andOn("visa_pivots.language_code", knex.raw("?", [language]))
				})
				.innerJoin("country_pivots", function () {
					this.on("visas.location_id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})

				.modify(function (queryBuilder) {
					if (location_id) {
						queryBuilder.where("visas.location_id", location_id)
					}
					if (guest_rating) {
						queryBuilder.where("visas.average_rating", ">=", guest_rating)
					}
				})
				.limit(limit)
				.offset((page - 1) * limit)
				.select("visas.id", "visa_pivots.title", "country_pivots.name as country_name", "country_pivots.country_id as location_id", "visas.average_rating", "visas.comment_count", "visas.refund_days", "visas.approval_period")

			// Get all visa packages for all visas in one query
			const visaIds = visas.map((visa: any) => visa.id)
			const mainImages = await knex("visa_galleries")
				.select("visa_galleries.visa_id", "visa_galleries.image_url")
				.innerJoin("visa_gallery_pivot", "visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
				.whereIn("visa_galleries.visa_id", visaIds)
				.whereNull("visa_galleries.deleted_at")
				.whereNull("visa_gallery_pivot.deleted_at")
				.where("visa_gallery_pivot.language_code", language)
				.where("visa_gallery_pivot.category", "Kapak Resmi")
				.whereRaw(
					`visa_galleries.id IN (
        SELECT vg.id FROM visa_galleries vg
        LEFT JOIN visa_gallery_pivot vgp ON vg.id = vgp.visa_gallery_id
        WHERE vg.visa_id = visa_galleries.visa_id
        AND vg.deleted_at IS NULL
        AND vgp.deleted_at IS NULL
        AND vgp.language_code = ?
        AND vgp.category = 'Kapak Resmi'
        ORDER BY vg.created_at ASC
        LIMIT 1
    )`,
					[language]
				)
			visas.forEach((visa: any) => {
				const image_url = mainImages.find((img: any) => img.visa_id === visa.id)
				visa.image_url = image_url ? image_url.image_url : null
			})

			// Get all visa packages for all visas in one query
			const allvisaPackages = await knex("visa_packages")
				.whereIn("visa_packages.visa_id", visaIds)
				.innerJoin("visa_package_pivots", "visa_packages.id", "visa_package_pivots.visa_package_id")
				.where("visa_package_pivots.language_code", language)
				.whereNull("visa_packages.deleted_at")
				.select("visa_packages.id", "visa_packages.visa_id", "visa_package_pivots.name", "return_acceptance_period", "discount", "total_tax_amount", "constant_price")

			// Group visa packages by visa_id
			const visaPackagesByvisaId = allvisaPackages.reduce((acc: Record<string, any[]>, pkg: any) => {
				if (!acc[pkg.visa_id]) {
					acc[pkg.visa_id] = []
				}
				acc[pkg.visa_id].push(pkg)
				return acc
			}, {} as Record<string, any[]>)

			// Get all visa package prices in one query
			const allvisaPackageIds = allvisaPackages.map((pkg: any) => pkg.id)
			// date gönderilmişse ve fiyat sabit değilse fiyatı tarihe göre getir
			const allvisaPackagePrices = await knex("visa_package_prices")
				.whereIn("visa_package_prices.visa_package_id", allvisaPackageIds)
				.innerJoin("currencies", "visa_package_prices.currency_id", "currencies.id")
				.innerJoin("currency_pivots", "currencies.id", "currency_pivots.currency_id")
				.where("currency_pivots.language_code", language)
				.whereNull("visa_package_prices.deleted_at")
				.select("visa_package_prices.id", "visa_package_prices.visa_package_id", "visa_package_prices.main_price", "visa_package_prices.child_price", "visa_package_prices.currency_id", "visa_package_prices.start_date", "visa_package_prices.end_date", "currency_pivots.name", "currencies.code", "currencies.symbol")

			// visa packages içinde visa_package_prices'ı bul ve ata
			allvisaPackages.forEach((item: any) => {
				let visa_package_price = allvisaPackagePrices.filter((price: any) => price.visa_package_id === item.id)
				if (item.constant_price) {
					item.visa_package_price = visa_package_price.length > 0 ? visa_package_price[0] : null
				} else if (date) {
					item.visa_package_price = visa_package_price.find((price: any) => price.date <= new Date(date) && price.date >= new Date(date))
				} else {
					// en düşük fiyatlı olanı ata
					item.visa_package_price = visa_package_price.reduce((lowest: any, current: any) => {
						return current.main_price < lowest.main_price ? current : lowest
					}, visa_package_price[0])
				}
			})

			visas.forEach((visa: any) => {
				// Her vize için, ona ait tüm paketleri bul ve en düşük fiyatlı olanı ata
				const relatedPackages = allvisaPackages.filter((visaPackage: any) => visaPackage.visa_id === visa.id)
				if (relatedPackages.length > 0) {
					// Fiyatı olan paketleri filtrele
					const packagesWithPrice = relatedPackages.filter((pkg: any) => pkg.visa_package_price && pkg.visa_package_price.main_price !== undefined && pkg.visa_package_price.main_price !== null)
					if (packagesWithPrice.length > 0) {
						// En düşük fiyatlı paketi bul
						let minPricePackage = packagesWithPrice[0]
						for (let i = 1; i < packagesWithPrice.length; i++) {
							if (packagesWithPrice[i].visa_package_price.main_price < minPricePackage.visa_package_price.main_price) {
								minPricePackage = packagesWithPrice[i]
							}
						}
						visa.visa_package = minPricePackage
					} else {
						// Fiyatı olmayan varsa ilkini ata
						visa.visa_package = relatedPackages[0]
					}
				} else {
					visa.visa_package = null
				}
			})

			visas.forEach((visa: any) => {
				if (visa.constant_price) {
					visa.visa_packages.forEach((visaPackage: any) => {
						visaPackage.visa_package_price = allvisaPackagePrices.find((price: any) => price.visa_package_id === visaPackage.id)
					})
				}
			})

			// Fiyat filtreleri ve sıralama öncesi, total'ı doğru hesaplamak için filtrelenmiş vizeleri bul
			let filteredVisas = visas

			if (min_price) {
				filteredVisas = filteredVisas.filter((visa: any) => Number(visa?.visa_package?.visa_package_price?.main_price || 0) >= Number(min_price))
			}
			if (max_price) {
				const maxPrice = Number(max_price)
				filteredVisas = filteredVisas.filter((visa: any) => Number(visa?.visa_package?.visa_package_price?.main_price || 0) <= maxPrice)
			}

			// Sıralama
			if (arrangement === "price_increasing") {
				filteredVisas.sort((a: any, b: any) => (a?.visa_package?.visa_package_price?.main_price || 0) - (b?.visa_package?.visa_package_price?.main_price || 0))
			} else if (arrangement === "price_decreasing") {
				filteredVisas.sort((a: any, b: any) => (b?.visa_package?.visa_package_price?.main_price || 0) - (a?.visa_package?.visa_package_price?.main_price || 0))
			} else if (arrangement === "star_increasing") {
				filteredVisas.sort((a: any, b: any) => 0)
			} else if (arrangement === "star_decreasing") {
				filteredVisas.sort((a: any, b: any) => 0)
			} else if (arrangement === "rating_increasing") {
				filteredVisas.sort((a: any, b: any) => a.average_rating - b.average_rating)
			} else if (arrangement === "rating_decreasing") {
				filteredVisas.sort((a: any, b: any) => b.average_rating - a.average_rating)
			}

			// total yanlış oluyordu, countQuery ile değil, filtrelenmiş vizelerin sayısı ile alınmalı
			// const total = await countQuery.first();
			// const totalPages = Math.ceil(total?.total ?? 0 / Number(limit));
			const total = filteredVisas.length
			const totalPages = Math.ceil(total / Number(limit))

			// Sayfalama uygula
			const paginatedVisas = filteredVisas.slice((page - 1) * limit, (page - 1) * limit + limit)

			return res.status(200).send({
				success: true,
				message: "visas fetched successfully",
				data: paginatedVisas,
				total: total,
				totalPages: totalPages,
			})
		} catch (error) {
			console.error("visas error:", error)
			return res.status(500).send({
				success: false,
				message: "visas fetch failed",
			})
		}
	}
	async show(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as any
			const language = (req as any).language

			// Tek sorguda tüm veriyi çek
			const results = await knex("visas")
				.where("visas.id", id)
				.whereNull("visas.deleted_at")

				// Visa bilgileri
				.innerJoin("visa_pivots", function () {
					this.on("visas.id", "visa_pivots.visa_id").andOn("visa_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("visa_pivots.deleted_at")

				// Şehir ve ülke bilgileri
				.innerJoin("countries", "visas.location_id", "countries.id")
				.innerJoin("country_pivots", function () {
					this.on("countries.id", "country_pivots.country_id").andOn("country_pivots.language_code", knex.raw("?", [language]))
				})
				.whereNull("country_pivots.deleted_at")

				// Gallery bilgileri
				.leftJoin("visa_galleries", function () {
					this.on("visas.id", "visa_galleries.visa_id").andOnNull("visa_galleries.deleted_at")
				})
				.leftJoin("visa_gallery_pivot", function () {
					this.on("visa_galleries.id", "visa_gallery_pivot.visa_gallery_id")
						.andOn("visa_gallery_pivot.language_code", knex.raw("?", [language]))
						.andOnNull("visa_gallery_pivot.deleted_at")
				})

				// Visa özellikleri
				.leftJoin("visa_features", function () {
					this.on("visas.id", "visa_features.visa_id").andOnNull("visa_features.deleted_at")
				})
				.leftJoin("visa_feature_pivots", function () {
					this.on("visa_features.id", "visa_feature_pivots.visa_feature_id")
						.andOn("visa_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("visa_feature_pivots.deleted_at")
				})

				// Visa olanakları
				// .leftJoin("visa_opportunities", "visas.id", "visa_opportunities.visa_id")
				// .leftJoin("visa_opportunity_pivots", function () {
				// 	this.on("visa_opportunities.id", "visa_opportunity_pivots.visa_opportunity_id")
				// 		.andOn("visa_opportunity_pivots.language_code", knex.raw("?", [language]))
				// 		.andOnNull("visa_opportunities.deleted_at")
				// 		.andOnNull("visa_opportunity_pivots.deleted_at")
				// })

				// Paket bilgileri
				.leftJoin("visa_packages", function () {
					this.on("visas.id", "visa_packages.visa_id").andOnNull("visa_packages.deleted_at")
				})
				.leftJoin("visa_package_pivots", function () {
					this.on("visa_packages.id", "visa_package_pivots.visa_package_id")
						.andOn("visa_package_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("visa_package_pivots.deleted_at")
				})

				// Paket fiyatları
				.leftJoin("visa_package_prices", function () {
					this.on("visa_packages.id", "visa_package_prices.visa_package_id").andOnNull("visa_package_prices.deleted_at")
				})

				// Para birimi bilgileri
				.leftJoin("currencies", "visa_package_prices.currency_id", "currencies.id")
				.leftJoin("currency_pivots", function () {
					this.on("currencies.id", "currency_pivots.currency_id").andOn("currency_pivots.language_code", knex.raw("?", [language]))
				})

				// Paket resimleri
				.leftJoin("visa_package_images", function () {
					this.on("visa_packages.id", "visa_package_images.visa_package_id").andOnNull("visa_package_images.deleted_at")
				})

				// Paket özellikleri
				.leftJoin("visa_package_features", function () {
					this.on("visa_packages.id", "visa_package_features.visa_package_id").andOnNull("visa_package_features.deleted_at")
				})
				.leftJoin("visa_package_feature_pivots", function () {
					this.on("visa_package_features.id", "visa_package_feature_pivots.visa_package_feature_id")
						.andOn("visa_package_feature_pivots.language_code", knex.raw("?", [language]))
						.andOnNull("visa_package_feature_pivots.deleted_at")
				})

				.select(
					// Visa bilgileri
					"visas.*",
					"visa_pivots.title as visa_title",
					"visa_pivots.general_info as general_info",
					"visa_pivots.visa_info",
					"visa_pivots.refund_policy as visa_refund_policy",

					// Lokasyon bilgileri
					"country_pivots.name as country_name",

					// Gallery bilgileri
					"visa_galleries.id as gallery_id",
					"visa_galleries.image_url as gallery_image_url",
					"visa_galleries.image_type as gallery_image_type",
					"visa_gallery_pivot.category as gallery_category",

					// Visa features
					"visa_features.id as feature_id",
					"visa_features.status as feature_status",
					"visa_feature_pivots.name as feature_name",

					// Visa opportunities
					// "visa_opportunities.id as opportunity_id",
					// "visa_opportunity_pivots.name as opportunity_name",

					// Paket bilgileri
					"visa_packages.id as package_id",
					"visa_package_pivots.name as package_name",
					"visa_package_pivots.description as package_description",
					"visa_package_pivots.refund_policy as package_refund_policy",
					"visa_packages.return_acceptance_period",
					"visa_packages.discount",
					"visa_packages.total_tax_amount",
					"visa_packages.constant_price",

					// Paket fiyatları (baby_price YOK!)
					"visa_package_prices.id as price_id",
					"visa_package_prices.main_price",
					"visa_package_prices.child_price",
					// "visa_package_prices.baby_price", // Visa'da baby_price YOK!
					"visa_package_prices.start_date",
					"visa_package_prices.end_date",
					"currency_pivots.name as currency_name",
					"currencies.code as currency_code",
					"currencies.symbol as currency_symbol",

					// Paket resimleri
					"visa_package_images.id as package_image_id",
					"visa_package_images.image_url as package_image_url",

					// Paket özellikleri
					"visa_package_features.id as package_feature_id",
					"visa_package_features.status as package_feature_status",
					"visa_package_feature_pivots.name as package_feature_name"
				)

			if (results.length === 0) {
				return res.status(404).send({
					success: false,
					message: "Visa not found",
				})
			}

			// İlk satırdan visa bilgilerini al
			const firstRow = results[0]
			const visa = {
				id: firstRow.id,
				title: firstRow.visa_title,
				general_info: firstRow.general_info,
				visa_info: firstRow.visa_info,
				refund_policy: firstRow.visa_refund_policy,
				country_name: firstRow.country_name,
				city_name: firstRow.city_name,
				refund_days: firstRow.refund_days,
				approval_period: firstRow.approval_period,
				average_rating: firstRow.average_rating,
				comment_count: firstRow.comment_count,
				created_at: firstRow.created_at,
				updated_at: firstRow.updated_at,
				packages: [],
				galleries: [],
				features: [],
				comments: [],
				// opportunities: [],
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
						images: [],
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

				// Paket fiyatları (Hotel mantığı - baby_price YOK!)
				if (row.price_id && !packageData.selectedPrice) {
					let selectedPrice = null

					if (row.constant_price) {
						// Sabit fiyat ise herhangi bir fiyat al
						selectedPrice = {
							id: row.price_id,
							main_price: row.main_price,
							child_price: row.child_price,
							// baby_price: row.baby_price, // Visa'da baby_price YOK!
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
									// baby_price: row.baby_price, // Visa'da baby_price YOK!
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

			visa.packages = Array.from(packageMap.values()).map((pkg: any) => ({
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

			visa.galleries = Array.from(galleryMap.values()) as any

			// Visa özelliklerini grupla
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

			visa.features = Array.from(featureMap.values()) as any

			// Visa olanakları grupla
			// const opportunityMap = new Map()

			// results.forEach((row: any) => {
			// 	if (!row.opportunity_id) return

			// 	if (!opportunityMap.has(row.opportunity_id)) {
			// 		opportunityMap.set(row.opportunity_id, {
			// 			id: row.opportunity_id,
			// 			name: row.opportunity_name,
			// 		})
			// 	}
			// })

			// visa.opportunities = Array.from(opportunityMap.values()) as any
			const visaModel = new VisaModel()
			const comments = await visaModel.getComments(language, 100, id)
			visa.comments = comments as any

			return res.status(200).send({
				success: true,
				message: "Visa retrieved successfully",
				data: visa,
			})
		} catch (error) {
			console.error("Visa show error:", error)
			return res.status(500).send({
				success: false,
				message: "Failed to retrieve visa",
			})
		}
	}
}
