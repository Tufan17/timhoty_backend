import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("activity_packages", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("activity_id").references("id").inTable("activities").onDelete("CASCADE")
		table.integer("return_acceptance_period").nullable()
		table.double("discount").nullable()
		table.boolean("constant_price").defaultTo(false)
		table.double("total_tax_amount").nullable()
		table.date("date").nullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("activity_packages")
}
