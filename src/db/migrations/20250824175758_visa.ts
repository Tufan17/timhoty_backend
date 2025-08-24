import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("visas", (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid("location_id").references("id").inTable("cities").onDelete("CASCADE");
        table.integer("refund_days");
        table.integer("approval_period");
        table.uuid("solution_partner_id").references("id").inTable("solution_partners").onDelete("CASCADE");
        table.boolean("status").defaultTo(false);
        table.boolean("highlight").defaultTo(false);
        table.boolean("admin_approval").defaultTo(false);
        table.integer("comment_count");
        table.float("average_rating");
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.timestamp('deleted_at').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("visas");
}

