import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('dealer_commissions', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('dealer_id').references('id').inTable('dealers');
        table.uuid('insurance_type_id').references('id').inTable('insurance_types');
        table.double('commission_rate').defaultTo(0.0);
        table.boolean('status').defaultTo(true);
        table.uuid('created_by').references('id').inTable('admins');
        table.uuid('updated_by').references('id').inTable('admins');
        table.uuid('deleted_by').references('id').inTable('admins').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('dealer_commissions');
}

