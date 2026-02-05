import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cities", table => {
		table.integer("destination_id").nullable().unique()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("cities", table => {
		table.dropColumn("destination_id")
	})
}
