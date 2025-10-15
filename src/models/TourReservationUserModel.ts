import BaseModel from "@/models/BaseModel"
import knex from "@/db/knex"

class TourReservationUserModel extends BaseModel {
	constructor() {
		super("tour_reservation_users")
	}

	static columns = ["id", "tour_reservation_id", "name", "surname", "birthday", "email", "phone", "type", "age", "room", "created_at", "updated_at", "deleted_at"]

	async getUsersByReservationId(tourReservationId: string) {
		return await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).whereNull("deleted_at").orderBy("created_at", "asc")
	}

	async getAdultsByReservationId(tourReservationId: string) {
		return await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).where("type", "adult").whereNull("deleted_at").orderBy("created_at", "asc")
	}

	async getChildrenByReservationId(tourReservationId: string) {
		return await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).where("type", "child").whereNull("deleted_at").orderBy("created_at", "asc")
	}

	async getUserByEmail(email: string) {
		return await knex("tour_reservation_users").where("email", email).whereNull("deleted_at").first()
	}

	async getUsersByPhone(phone: string) {
		return await knex("tour_reservation_users").where("phone", phone).whereNull("deleted_at").orderBy("created_at", "desc")
	}

	async deleteByReservationId(tourReservationId: string) {
		await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).whereNull("deleted_at").update({ deleted_at: new Date() })
	}

	async getReservationUserStats(tourReservationId: string) {
		const total = await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).whereNull("deleted_at").count("id as total").first()

		const adults = await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).where("type", "adult").whereNull("deleted_at").count("id as adults").first()

		const children = await knex("tour_reservation_users").where("tour_reservation_id", tourReservationId).where("type", "child").whereNull("deleted_at").count("id as children").first()

		return {
			total: total?.total || 0,
			adults: adults?.adults || 0,
			children: children?.children || 0,
		}
	}

	async getUsersWithReservationDetails(userId: string) {
		return await knex("tour_reservation_users")
			.leftJoin("tour_reservations", "tour_reservation_users.tour_reservation_id", "tour_reservations.id")
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("tour_pivots", function () {
				this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", "en")
			})
			.leftJoin("tour_packages", "tour_reservations.package_id", "tour_packages.id")
			.leftJoin("tour_package_prices", "tour_packages.id", "tour_package_prices.tour_package_id")
			.leftJoin("currencies", "tour_package_prices.currency_id", "currencies.id")
			.select("tour_reservation_users.*", "tour_reservations.status as reservation_status", "tour_reservations.payment_id", "tour_reservations.created_at as reservation_date", "tour_pivots.title as tour_title", "tour_package_prices.price as package_price", "currencies.code as currency_code", "currencies.symbol as currency_symbol")
			.where("tour_reservation_users.id", userId)
			.whereNull("tour_reservation_users.deleted_at")
			.first()
	}

	async getReservationsByUserEmail(email: string) {
		return await knex("tour_reservation_users")
			.leftJoin("tour_reservations", "tour_reservation_users.tour_reservation_id", "tour_reservations.id")
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("tour_pivots", function () {
				this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", "en")
			})
			.select("tour_reservation_users.*", "tour_reservations.status as reservation_status", "tour_reservations.payment_id", "tour_reservations.created_at as reservation_date", "tour_pivots.title as tour_title")
			.where("tour_reservation_users.email", email)
			.whereNull("tour_reservation_users.deleted_at")
			.whereNull("tour_reservations.deleted_at")
			.orderBy("tour_reservations.created_at", "desc")
	}

	async getReservationsByUserPhone(phone: string) {
		return await knex("tour_reservation_users")
			.leftJoin("tour_reservations", "tour_reservation_users.tour_reservation_id", "tour_reservations.id")
			.leftJoin("tours", "tour_reservations.tour_id", "tours.id")
			.leftJoin("tour_pivots", function () {
				this.on("tours.id", "=", "tour_pivots.tour_id").andOn("tour_pivots.language_code", "=", "en")
			})
			.select("tour_reservation_users.*", "tour_reservations.status as reservation_status", "tour_reservations.payment_id", "tour_reservations.created_at as reservation_date", "tour_pivots.title as tour_title")
			.where("tour_reservation_users.phone", phone)
			.whereNull("tour_reservation_users.deleted_at")
			.whereNull("tour_reservations.deleted_at")
			.orderBy("tour_reservations.created_at", "desc")
	}

	async createMultipleUsers(users: any[]) {
		return await knex("tour_reservation_users").insert(users).returning("*")
	}

	async updateUserInfo(id: string, userData: any) {
		return await knex("tour_reservation_users")
			.where("id", id)
			.whereNull("deleted_at")
			.update({
				...userData,
				updated_at: new Date(),
			})
	}
}

export default TourReservationUserModel
