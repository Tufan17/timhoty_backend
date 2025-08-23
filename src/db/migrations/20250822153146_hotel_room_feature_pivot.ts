import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("hotel_room_feature_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("hotel_room_feature_id").references("id").inTable("hotel_room_features");
        table.string("language_code");
        table.string("name");
        table.timestamps(true, true);
        table.unique(["hotel_room_feature_id", "language_code"]);
    });
}   


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("hotel_room_feature_pivots");
}

