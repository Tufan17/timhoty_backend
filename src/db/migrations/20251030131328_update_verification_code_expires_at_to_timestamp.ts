import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', (table) => {
        table.timestamp('verification_code_expires_at').nullable().alter();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', (table) => {
        table.date('verification_code_expires_at').nullable().alter();
    });
}

