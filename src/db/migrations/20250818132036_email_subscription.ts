import type { Knex } from "knex";




export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('email_subscriptions', (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string('language_code').notNullable().defaultTo("en");
    table.string('email').notNullable();
    table.boolean('is_canceled').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('email_subscriptions');
}

