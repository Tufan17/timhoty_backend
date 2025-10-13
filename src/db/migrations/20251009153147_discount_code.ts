import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("discount_codes", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.string("code").notNullable()
		table.enum("service_type", ["hotel", "car_rental", "activity", "tour", "visa"]).notNullable().defaultTo("hotel")
		table.decimal("amount", 10, 2).nullable()
		table.date("validity_period").nullable()
		table.decimal("percentage", 10, 2).nullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("discount_codes")
}
