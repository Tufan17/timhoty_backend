import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("offers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid("operation_id").notNullable().references("id").inTable("operations");
        table.uuid("company_id").notNullable().references("id").inTable("companies");
        table.string("price").notNullable();
        table.boolean("status").defaultTo(false);
        table.timestamp("start_date").defaultTo(knex.fn.now());
        table.timestamp("end_date").defaultTo(knex.fn.now());
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("offers");
}

