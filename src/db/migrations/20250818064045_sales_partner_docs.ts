import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("sales_partner_docs", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("sales_partner_id").notNullable().references("id").inTable("sales_partners");
        table.string("doc_url").notNullable();
        table.string("created_at").defaultTo(knex.fn.now());
        table.string("updated_at").defaultTo(knex.fn.now());
        table.string("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("sales_partner_docs");
}

