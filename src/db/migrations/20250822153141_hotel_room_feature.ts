import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("hotel_room_features", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("hotel_room_id").references("id").inTable("hotel_rooms");
        table.string("name");
        table.boolean("status").defaultTo(true);
        table.timestamps(true, true);
    });

}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("hotel_room_features");
}

