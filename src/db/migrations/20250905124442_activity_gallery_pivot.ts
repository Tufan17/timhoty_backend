import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("activity_gallery_pivots", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("activity_gallery_id").references("id").inTable("activity_galleries").onDelete("CASCADE")
		table.string("category").notNullable()
		table.string("language_code").notNullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("activity_gallery_pivots")
}
