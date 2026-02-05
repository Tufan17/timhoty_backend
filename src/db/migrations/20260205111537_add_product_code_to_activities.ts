import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activities", table => {
		table.string("product_code").nullable().unique() // Viator product code
		table.string("type").notNullable().defaultTo("main") // "main" or "viator"
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activities", table => {
		table.dropColumn("product_code")
		table.dropColumn("type")
	})
}
