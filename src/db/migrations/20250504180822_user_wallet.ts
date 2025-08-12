import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("user_wallets", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("user_id").notNullable().references("id").inTable("users");
        table.uuid("policy_id").notNullable().references("id").inTable("policies");
        table.integer("point").nullable().defaultTo(0);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}



export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("user_wallets");
}

