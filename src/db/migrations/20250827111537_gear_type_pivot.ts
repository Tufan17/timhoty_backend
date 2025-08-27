import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("gear_type_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("gear_type_id").references("id").inTable("gear_types").onDelete("CASCADE");
        table.string("language_code");
        table.string("name");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}   


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("gear_type_pivots");
}

