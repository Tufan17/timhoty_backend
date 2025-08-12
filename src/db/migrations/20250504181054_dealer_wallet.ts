import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("dealer_wallets", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("dealer_id").notNullable().references("id").inTable("dealers");
        table.uuid("policy_id").notNullable().references("id").inTable("policies");
        table.uuid("dealer_user_id").notNullable().references("id").inTable("dealer_users");
        table.double("price").notNullable();
        table.enum("type", ["sell", "cancel"]).notNullable().defaultTo("sell");
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("dealer_wallets");
}

