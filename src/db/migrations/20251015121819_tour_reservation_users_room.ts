import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("tour_reservation_users", table => {
		table.integer("room").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("tour_reservation_users", table => {
		table.dropColumn("room")
	})
}
