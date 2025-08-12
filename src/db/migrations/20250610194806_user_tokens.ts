import type { Knex } from "knex";
import { text } from "node:stream/consumers";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('user_tokens', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.text('token').notNullable();
        table.enum('type', ['web', 'mobile']).notNullable();
        table.timestamp('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('user_tokens');
}

