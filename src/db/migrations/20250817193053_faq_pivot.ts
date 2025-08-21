import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("faq_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("faq_id").notNullable().references("id").inTable("faqs").onDelete("CASCADE");
        table.string("title").notNullable();
        table.text("description").notNullable();
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("faq_pivots");
}

