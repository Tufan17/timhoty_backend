import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('logs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.enum('type', ['user', 'dealer', 'admin']).notNullable();
        table.enum('process', ['create', 'update', 'delete']).notNullable();
        table.string('target_name').notNullable();
        table.string('target_id').notNullable();
        table.string('user_id').notNullable();
        table.text('content').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('logs');
}

