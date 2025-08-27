import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("stations", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("location_id").references("id").inTable("cities").onDelete("CASCADE");
        table.uuid("solution_partner_id").nullable().references("id").inTable("solution_partners").onDelete("CASCADE");
        table.string("map_location").notNullable();
        table.boolean("status").defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("stations");
}

