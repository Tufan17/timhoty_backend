import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("tours", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("solution_partner_id").references("id").inTable("solution_partners").onDelete("CASCADE");
        table.boolean("status").defaultTo(false);
        table.boolean("highlight").defaultTo(false);
        table.boolean("admin_approval").defaultTo(false);
        table.integer("night_count").notNullable().defaultTo(0);
        table.integer("day_count").notNullable().defaultTo(0);
        table.integer("refund_days").notNullable().defaultTo(0);
        table.integer("user_count").notNullable().defaultTo(0);
        table.integer("comment_count").notNullable().defaultTo(0);
        table.float("average_rating").notNullable().defaultTo(0);

        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("tours");
}

