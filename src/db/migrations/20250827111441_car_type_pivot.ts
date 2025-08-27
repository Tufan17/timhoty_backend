import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("car_type_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("car_type_id").references("id").inTable("car_types").onDelete("CASCADE");
        table.string("language_code");
        table.string("name");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("car_type_pivots");
}

