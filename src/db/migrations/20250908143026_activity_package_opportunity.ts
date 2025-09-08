import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("activity_package_opportunities", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("activity_package_id").notNullable().references("id").inTable("activity_packages").onDelete("CASCADE")
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("activity_package_opportunities")
}
