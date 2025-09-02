import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("tour_package_prices", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("tour_package_id").references("id").inTable("tour_packages").onDelete("CASCADE");
        table.double("main_price").notNullable();
        table.double("child_price").nullable();
        table.double("baby_price").nullable();
        table.uuid("currency_id").references("id").inTable("currencies").onDelete("CASCADE");
        table.timestamp("start_date").nullable();
        table.timestamp("end_date").nullable();
        table.string("period").nullable();
        table.integer("quota").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}   


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("tour_package_prices");
}

