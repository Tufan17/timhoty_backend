import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("hotel_room_opportunity_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("hotel_room_opportunity_id").notNullable().references("id").inTable("hotel_room_opportunities").onDelete("CASCADE");
        table.string("name");
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}   


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("hotel_room_opportunity_pivots");
}

