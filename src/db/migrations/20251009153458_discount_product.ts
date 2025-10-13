import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("discount_products", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("discount_code_id").notNullable().references("id").inTable("discount_codes").onDelete("CASCADE")

		table.uuid("product_id").notNullable()
		table.enum("service_type", ["hotel", "car_rental", "activity", "tour", "visa"]).notNullable().defaultTo("hotel")
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("discount_products")
}
