import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("solution_partner_users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("solution_partner_id").notNullable().references("id").inTable("solution_partners").onDelete("CASCADE");
        table.enum("type", ["manager", "worker"]).notNullable().defaultTo("worker");
        table.string("name_surname").notNullable();
        table.string("phone").notNullable();
        table.string("email").notNullable();
        table.string("password").notNullable();
        table.string("language_code").notNullable().defaultTo("en");
        table.boolean("status").notNullable().defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("solution_partner_users");
}

