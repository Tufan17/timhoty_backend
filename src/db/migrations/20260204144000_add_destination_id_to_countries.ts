import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable("countries", table => {
		table.integer("destination_id").nullable().unique()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable("countries", table => {
		table.dropColumn("destination_id")
	})
}
