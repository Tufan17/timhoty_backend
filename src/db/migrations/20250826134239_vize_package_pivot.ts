import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("visa_package_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("visa_package_id").references("id").inTable("visa_packages").onDelete("CASCADE");
        table.string("language_code");
        table.string("name").notNullable();
        table.text("description").nullable();
        table.text("refund_policy").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}   


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("visa_packages");
}

