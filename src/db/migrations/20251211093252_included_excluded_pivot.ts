import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("included_excluded_pivot", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("included_excluded_id").notNullable().references("id").inTable("included_excluded").onDelete("CASCADE")
		table.string("language_code")
		table.string("name").notNullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("included_excluded_pivot")
}
