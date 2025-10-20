import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("visas", table => {
		table.dropForeign(["location_id"], "visas_location_id_foreign")
	})

	await knex.schema.alterTable("visas", table => {
		table.foreign("location_id").references("id").inTable("countries").onDelete("CASCADE")
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("visas", table => {
		table.dropForeign(["location_id"], "visas_location_id_foreign")
	})

	await knex.schema.alterTable("visas", table => {
		table.foreign("location_id").references("id").inTable("cities").onDelete("CASCADE")
	})
}
