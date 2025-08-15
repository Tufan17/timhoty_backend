import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name_surname').notNullable()
        table.string('email').notNullable().unique()
        table.string('phone').nullable()
        table.string('password').notNullable()
        table.string('language').notNullable().defaultTo('en')
        table.date('birthday').nullable()
        table.boolean('email_verified').nullable().defaultTo(false)
        table.boolean('status').notNullable().defaultTo(true)
        table.boolean('sms_contact').nullable().defaultTo(false)
        table.boolean('email_contact').nullable().defaultTo(false)
        table.boolean('push_contact').nullable().defaultTo(false)
        table.boolean('electronic_contact_permission').nullable().defaultTo(false);
        table.uuid('currency_id').references('id').inTable('currencies').nullable()
        table.string('device_id').nullable()
        table.string('verification_code').nullable()
        table.date('verification_code_expires_at').nullable()
        table.string('avatar').nullable()
        table.string('created_at').defaultTo(knex.fn.now())
        table.string('updated_at').defaultTo(knex.fn.now())
        table.string('deleted_at').nullable()
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('users')
}