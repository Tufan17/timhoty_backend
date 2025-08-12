import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('dealer_users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('email').notNullable()
        table.string('password').notNullable()
        table.string('name_surname').notNullable()
        table.string('tc_no').notNullable()
        table.string('gsm').notNullable()
        table.enum('type', ['manager', 'user']).notNullable()
        table.uuid('dealer_id').references('id').inTable('dealers')
        table.string('otp_code').nullable()
        table.timestamp('otp_code_expires_at').nullable()
        table.boolean('status').notNullable()
        table.boolean('verify').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now()) 
        table.timestamp('deleted_at').nullable()
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('dealer_users')
}

