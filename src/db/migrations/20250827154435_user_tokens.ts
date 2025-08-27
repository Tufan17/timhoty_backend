import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("user_tokens", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
        table.string("token_hash").notNullable();
        table.string("device_name").nullable();
        table.timestamp("expires_at").notNullable();
        table.timestamp("revoked_at").nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("user_tokens");
}

