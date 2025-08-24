import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("visa_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("visa_id").notNullable().references("id").inTable("visas").onDelete("CASCADE");
        table.string("title");
        table.text("general_info");
        table.text("visa_info");
        table.text("refund_policy");
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("visa_pivots");
}

