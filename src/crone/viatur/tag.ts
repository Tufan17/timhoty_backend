import { viatorApiService } from "@/services/ViatorApi"
import ActivityTypeModel from "@/models/ActivityTypeModel"
import { translateCreate } from "@/helper/translate"

export async function getTags() {
	try {
		const result = await viatorApiService.getTags()
		const allTags = result.tags || []

		// Filter: Sadece parent tag'lar (parentTagIds olmayanlar)
		const parentTags = []
		for (let i = 0; i < allTags.length; i++) {
			if (!allTags[i].parentTagIds || allTags[i].parentTagIds.length === 0) {
				parentTags.push(allTags[i])
			}
		}

		console.log(`✅ Total tags: ${allTags.length}`)
		console.log(`🎯 Parent tags (filtered): ${parentTags.length}`)

		for (const tag of parentTags) {
			try {
				// 1. Duplicate check
				const existing = await new ActivityTypeModel().first({
					tag_id: tag.tagId,
				})

				if (existing) {
					continue
				}

				// 2. Activity type oluştur
				const newActivityType = await new ActivityTypeModel().create({
					tag_id: tag.tagId,
					status: true,
				})

				// 3. Pivot kayıtları (EN + TR)
				await translateCreate({
					target: "activities_type_pivots",
					target_id_key: "activity_type_id",
					target_id: newActivityType.id,
					language_code: "en",
					data: {
						name: tag.allNamesByLocale.en || tag.allNamesByLocale.en_AU || "Unknown",
					},
				})
			} catch (err: any) {
				console.error(`Tag sync error for ${tag.tagId}:`, err.message)
			}
		}

		return {
			success: true,
			message: "Tags synced successfully",
			data: {
				totalTags: allTags.length,
				parentTags: parentTags.length,
			},
		}
	} catch (error: any) {
		console.error("Tags sync error:", error)
		return {
			success: false,
			message: error.message || "Get tags failed",
		}
	}
}
