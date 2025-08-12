import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('blogs', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('title').notNullable();
        table.text('description').nullable();
        table.text('content').notNullable();
        table.uuid('insurance_type_id').references('id').inTable('insurance_types');
        table.string('imageUrl').nullable();
        table.boolean('status').defaultTo(true);
        table.uuid('created_by').references('id').inTable('admins');
        table.uuid('updated_by').references('id').inTable('admins');
        table.uuid('deleted_by').references('id').inTable('admins').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').nullable();
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('blogs');
}

