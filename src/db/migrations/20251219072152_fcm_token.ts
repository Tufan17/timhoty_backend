import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	const exists = await knex.schema.hasTable("fcm_token")
	if (exists) return

	return knex.schema.createTable("fcm_token", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.string("token").notNullable()
		table.string("language").notNullable()
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("fcm_token")
}
