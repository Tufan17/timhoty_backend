import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("tour_group_asks", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		// name
		table.string("name").notNullable()
		// email
		table.string("email").notNullable()
		// phone
		table.string("phone").notNullable()
		//user count
		table.string("user_count").notNullable()
		//date
		table.string("date").notNullable()
		//tour id
		table.uuid("tour_id").references("id").inTable("tours").onDelete("CASCADE").notNullable()
		// message
		table.text("message").notNullable()
		//status boolean
		table.boolean("status").notNullable().defaultTo(false)
		//answer text
		table.text("answer").nullable()
		//user id
		table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE").nullable()

		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("tour_group_asks")
}
