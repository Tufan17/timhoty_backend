import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("hotel_room_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("hotel_room_id").notNullable().references("id").inTable("hotel_rooms").onDelete("CASCADE");
        table.string("name");
        table.text("description");
        table.text("refund_policy");
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}   


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("hotel_room_pivots");
}

