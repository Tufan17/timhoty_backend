import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("car_pickup_delivery", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("car_rental_id").references("id").inTable("car_rentals").onDelete("CASCADE");
        table.uuid("station_id").references("id").inTable("stations").onDelete("CASCADE");
        table.boolean("status").defaultTo(false);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("car_pickup_delivery");
}

