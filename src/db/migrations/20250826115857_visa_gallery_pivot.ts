import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("visa_gallery_pivot", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("visa_gallery_id").references("id").inTable("visa_galleries").onDelete("CASCADE");
        table.string("category").notNullable();
        table.string("language_code").notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("visa_gallery_pivot");
}

