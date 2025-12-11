import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("services_included_excluded", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("included_excluded_id").notNullable().references("id").inTable("included_excluded").onDelete("CASCADE")
		table.uuid("service_id").notNullable()
		table.enum("type", ["normal", "package"]).notNullable().defaultTo("normal")
		table.enum("service_type", ["hotel", "rental", "activity", "tour", "visa"]).notNullable().defaultTo("hotel")
		table.boolean("status").notNullable().defaultTo(true)
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("services_included_excluded")
}
