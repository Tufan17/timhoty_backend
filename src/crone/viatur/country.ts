import { viatorApiService } from "@/services/ViatorApi"
import CountryModel from "@/models/CountryModel"
import CurrencyModel from "@/models/CurrencyModel"
import { translateCreate } from "@/helper/translate"

export async function getCountries() {
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

		return {
			success: true,
			message: "Countries synced successfully",
			data: {
				total: countries.length,
			},
		}
	} catch (error: any) {
		console.error("Countries sync error:", error)
		return {
			success: false,
			message: error.message || "Get countries failed",
		}
	}
}
