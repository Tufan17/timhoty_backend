import { viatorApiService } from "@/services/ViatorApi"
import CityModel from "@/models/CityModel"
import CountryModel from "@/models/CountryModel"
import { translateCreate } from "@/helper/translate"

export async function getCities() {
	try {
		const result = await viatorApiService.getDestinations()

		// Performanslı filtreleme - sadece CITY tipindekiler
		const cities = []
		for (let i = 0; i < result.destinations.length; i++) {
			if (result.destinations[i].type === "CITY") {
				cities.push(result.destinations[i])
			}
		}

		// destinationId'ye göre map oluştur (TÜM tipler dahil)
		// Bazı CITY'ler başka CITY'lerin parent'ı olabiliyor (örn: Santiago)
		const byId: Record<string, any> = {}
		for (const d of result.destinations) {
			byId[String(d.destinationId)] = d
		}

		// Her city için DB'ye kaydet
		for (const city of cities) {
			try {
				// 1. Duplicate check - destinationId'ye göre kontrol
				const existingCity = await new CityModel().first({
					destination_id: city.destinationId,
				})

				if (existingCity) {
					continue // Zaten var, skip
				}

				// 2. Parent chain'den COUNTRY bul (optimize: direkt bul, gereksiz array yok)
				let countryData = null
				let parentId = city.parentDestinationId

				while (parentId != null && byId[String(parentId)]) {
					const parent = byId[String(parentId)]

					if (parent.type === "COUNTRY") {
						countryData = parent
						break // COUNTRY bulunca loop'u sonlandır (early exit)
					}

					parentId = parent.parentDestinationId
				}

				if (!countryData) {
					console.log(`City ${city.name} için COUNTRY bulunamadı, atlanıyor...`)
					continue
				}

				// 3. DB'den country'yi al (destination_id ile)
				const country = await new CountryModel().first({
					destination_id: countryData.destinationId,
				})

				if (!country) {
					console.log(`Country (destination_id: ${countryData.destinationId}) DB'de bulunamadı, ${city.name} atlanıyor...`)
					continue
				}

				// 4. Cities tablosuna insert
				const newCity = await new CityModel().create({
					destination_id: city.destinationId,
					country_id: country.id,
					photo: null, // API'den gelmiyor
					number_plate: null, // API'den gelmiyor
				})

				// 5. City pivots oluştur (EN + TR)
				await translateCreate({
					target: "city_pivots",
					target_id_key: "city_id",
					target_id: newCity.id,
					language_code: "en", // API'den EN geliyor
					data: {
						name: city.name,
					},
				})
			} catch (error: any) {
				console.error(`City sync error for ${city.name}:`, error.message)
			}
		}

		return {
			success: true,
			message: "Cities synced successfully",
			data: {
				total: cities.length,
			},
		}
	} catch (error: any) {
		console.error("Cities sync error:", error)
		return {
			success: false,
			message: error.message || "Get cities failed",
		}
	}
}
