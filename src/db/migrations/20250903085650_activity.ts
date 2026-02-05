import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable("activities", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		table.uuid("location_id").references("id").inTable("cities").onDelete("CASCADE")
		table.uuid("solution_partner_id").references("id").inTable("solution_partners").onDelete("CASCADE")
		table.boolean("status").defaultTo(false)
		table.boolean("highlight").defaultTo(false)
		table.boolean("admin_approval").defaultTo(false)
		table.uuid("activity_type_id").references("id").inTable("activity_types").onDelete("CASCADE")
		table.boolean("free_purchase").defaultTo(false)
		//tükenmek üzere
		table.boolean("about_to_run_out").defaultTo(false)
		//aktivite süresi
		table.string("duration").notNullable()
		table.string("map_location")
		table.integer("approval_period")
		table.integer("comment_count").notNullable().defaultTo(0)
		table.float("average_rating").notNullable().defaultTo(0)
		//type
		// table.string("type").nullable().defaultTo("main")
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable("activities")
}
