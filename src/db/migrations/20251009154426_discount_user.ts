import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("discount_users", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("discount_code_id").notNullable().references("id").inTable("discount_codes").onDelete("CASCADE")
		table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE")
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("discount_users")
}
