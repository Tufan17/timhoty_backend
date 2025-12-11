import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("included_excluded", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.enum("service_type", ["hotel", "rental", "activity", "tour", "visa"]).notNullable().defaultTo("hotel")
		table.enum("type", ["normal", "package"]).notNullable().defaultTo("normal")
		table.boolean("status").notNullable().defaultTo(true)
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("included_excluded")
}
