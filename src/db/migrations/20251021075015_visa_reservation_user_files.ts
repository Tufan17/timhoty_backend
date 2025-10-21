import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable("visa_reservation_user_files", table => {
		table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"))
		// table.uuid("visa_reservation_user_id").notNullable().references("id").inTable("visa_reservation_users").onDelete("CASCADE")
		table.uuid("visa_reservation_id").notNullable().references("id").inTable("visa_reservations").onDelete("CASCADE")
		table.string("file_url").notNullable()
		table.string("file_name").notNullable()
		table.string("file_type").notNullable() // 'pdf', 'image', 'video'
		// table.string("document_type").nullable(); // 'passport', 'visa_photo', 'travel_document', etc.
		// table.integer("file_size").nullable(); // bytes cinsinden
		table.timestamp("created_at").defaultTo(knex.fn.now())
		table.timestamp("updated_at").defaultTo(knex.fn.now())
		table.timestamp("deleted_at").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable("visa_reservation_user_files")
}
