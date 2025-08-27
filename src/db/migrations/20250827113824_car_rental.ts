import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("car_rentals", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("location_id").references("id").inTable("cities").onDelete("CASCADE");
        table.uuid("solution_partner_id").references("id").inTable("solution_partners").onDelete("CASCADE");
        table.boolean("status").defaultTo(false);
        table.boolean("highlight").defaultTo(false);
        table.boolean("admin_approval").defaultTo(false);
        table.uuid("car_type_id").references("id").inTable("car_types").onDelete("CASCADE");
        table.uuid("gear_type_id").references("id").inTable("gear_types").onDelete("CASCADE");
        table.integer('user_count').notNullable().defaultTo(0);
        table.integer('door_count').notNullable().defaultTo(0);
        table.integer('age_limit').notNullable().defaultTo(0);
        table.boolean('air_conditioning').defaultTo(false);
        table.boolean("about_to_run_out").defaultTo(false);
        table.integer("comment_count").notNullable().defaultTo(0);
        table.float("average_rating").notNullable().defaultTo(0);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("car_rentals");
}

