import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activity_types", table => {
		table.integer("tag_id").nullable().unique() // Viator tag ID
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activity_types", table => {
		table.dropColumn("tag_id")
	})
}
