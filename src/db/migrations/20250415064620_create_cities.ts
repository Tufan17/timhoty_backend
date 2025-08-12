import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('cities', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name').notNullable()
        table.integer('number_plate').notNullable()
        table.string('created_at').defaultTo(knex.fn.now())
        table.string('updated_at').defaultTo(knex.fn.now())
        table.string('deleted_at').nullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('cities')
}   

