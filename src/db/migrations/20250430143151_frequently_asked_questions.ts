import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('frequently_asked_questions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.integer('order').notNullable();
        table.string('title').notNullable();
        table.text('content').notNullable();
        table.boolean('status').defaultTo(true);
        table.uuid('insurance_type_id').references('id').inTable('insurance_types');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('frequently_asked_questions');
}

