import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("solution_partner_commissions", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("solution_partner_id").notNullable().references("id").inTable("solution_partners");
        table.enum("service_type", ["hotel", "rental", "activity", "tour"]).notNullable().defaultTo("hotel");
        table.enum("commission_type", ["percentage", "fixed"]).notNullable().defaultTo("percentage");
        table.decimal("commission_value", 10, 2).notNullable();
        table.string("commission_currency").notNullable().defaultTo("USD");
        table.string("created_at").defaultTo(knex.fn.now());
        table.string("updated_at").defaultTo(knex.fn.now());
        table.string("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("solution_partner_commissions");
}

