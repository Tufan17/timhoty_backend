import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	const exists = await knex.schema.hasTable("activity_free_service")
	if (exists) return

	return knex.schema.createTable("activity_free_service", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("activity_reservation_id").nullable().references("id").inTable("activity_reservations").onDelete("CASCADE")
		table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE")
		table.uuid("activity_id").notNullable().references("id").inTable("activities").onDelete("CASCADE")
		table.decimal("lat", 10, 7).notNullable()
		table.decimal("lng", 10, 7).notNullable()
		table.text("address").notNullable()
		table.string("address_name").notNullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("activity_free_service")
}
