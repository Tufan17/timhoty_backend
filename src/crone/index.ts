import cron from "node-cron"
import { getCountries } from "./viatur/country"
import { getCities } from "./viatur/city"
import { getTags } from "./viatur/tag"
import { syncProducts } from "./viatur/product-sync"

// Her Gün Saat 10:00 çalıştı.
cron.schedule("0 10 * * *", () => {})

// Her ayın 1. günü saat 00:00 - Viator Countries, Cities, Tags & Products Sync
let isViatorSyncRunning = false
// "0 0 1 * *"
cron.schedule("* * * * *", async () => {
	if (isViatorSyncRunning) {
		console.log("⏳ Viator sync already running, skipping...")
		return
	}

	isViatorSyncRunning = true
	try {
		await getCountries()
		await getCities()
		await getTags()
		await syncProducts()
	} catch (err: any) {
		console.error("❌ Viator sync cron error:", err.message)
	} finally {
		isViatorSyncRunning = false
	}
})
