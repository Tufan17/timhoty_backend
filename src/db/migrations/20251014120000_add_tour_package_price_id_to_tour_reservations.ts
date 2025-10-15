import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.table("tour_reservations", table => {
		table.uuid("tour_package_price_id").nullable().references("id").inTable("tour_package_prices").onDelete("CASCADE")
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.table("tour_reservations", table => {
		table.dropColumn("tour_package_price_id")
	})
}
