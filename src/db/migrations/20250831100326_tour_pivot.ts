import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("tour_pivots", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("tour_id").notNullable().references("id").inTable("tours").onDelete("CASCADE");
        table.string("title");
        table.text("general_info");
        table.text("tour_info");
        table.text("refund_policy");
        table.string("language_code").notNullable().defaultTo("en");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("tour_pivots");
}

