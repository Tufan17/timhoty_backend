import type { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activity_packages", table => {
		table.renameColumn("date", "start_date")
		table.date("end_date").nullable()
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable("activity_packages", table => {
		table.date("end_date").notNullable().alter()
	})
}
