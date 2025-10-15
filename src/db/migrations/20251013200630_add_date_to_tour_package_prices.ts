import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.table("tour_package_prices", (table) => {
        table.date("date").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.table("tour_package_prices", (table) => {
        table.dropColumn("date");
    });
}

