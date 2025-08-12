import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('dealer_documents', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('dealer_id').references('id').inTable('dealers');
        table.string('name').notNullable();
        table.string('document_url').notNullable();
        table.boolean('status').defaultTo(true);
        table.dateTime('created_at').defaultTo(knex.fn.now());
        table.dateTime('updated_at').nullable();
        table.dateTime('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('dealer_documents');
}

