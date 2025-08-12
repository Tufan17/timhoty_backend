import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('dealers', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.text('name').notNullable()
        table.uuid('city_id').notNullable().references('id').inTable('cities')
        table.uuid('district_id').notNullable().references('id').inTable('districts')
        table.text('address').notNullable()
        table.string('phone').notNullable()
        table.string('tax_office').nullable()
        table.string('tax_number').nullable()
        table.string('bank_account_iban').nullable()
        table.string('bank_account_name').nullable()
        table.enum('type', ['individual', 'company']).defaultTo('company')
        table.boolean('verify').defaultTo(false)
        table.boolean('status').defaultTo(true)
        table.string('created_at').defaultTo(knex.fn.now())
        table.string('updated_at').defaultTo(knex.fn.now())
        table.string('deleted_at').nullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('dealers')
}

