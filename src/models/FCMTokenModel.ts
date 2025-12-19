import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class FCMTokenModel extends BaseModel {
	constructor() {
		super("fcm_token")
	}
	static columns = ["id", "token", "language", "created_at", "updated_at", "deleted_at"]

	async saveOrUpdateToken(token: string, language: string): Promise<any> {
		// Token var mı kontrol et
		const existingToken = await knex("fcm_token")
			.where("token", token)
			.whereNull("deleted_at")
			.first()

		if (existingToken) {
			// Token varsa güncelle
			const [updated] = await knex("fcm_token")
				.where("id", existingToken.id)
				.update({
					language,
					updated_at: new Date(),
				})
				.returning("*")
			return updated
		} else {
			// Token yoksa kaydet
			const [created] = await knex("fcm_token")
				.insert({
					token,
					language,
					created_at: new Date(),
					updated_at: new Date(),
				})
				.returning("*")
			return created
		}
	}
}

export default FCMTokenModel

