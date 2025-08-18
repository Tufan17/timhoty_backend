import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('admins', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name_surname').notNullable()
        table.string('email').notNullable()
        table.string('phone').notNullable()
        table.string('password').notNullable()
        table.string('language').notNullable()
        table.boolean('status').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at').nullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('admins')
}

