import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("city_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("city_id").notNullable().references("id").inTable("cities");
        table.string("name").notNullable();
        table.string("language_code").notNullable();
        table.string("created_at").defaultTo(knex.fn.now());
        table.string("updated_at").defaultTo(knex.fn.now());
        table.string("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("city_pivots");
}

