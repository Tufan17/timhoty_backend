import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("user_guide_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("user_guide_id").notNullable().references("id").inTable("user_guides").onDelete("CASCADE");
        table.string("title").notNullable();
        table.text("description").notNullable();
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("user_guide_pivots");
}

