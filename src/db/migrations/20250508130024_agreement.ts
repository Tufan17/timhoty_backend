import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("agreements", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("dealer_id").notNullable().references("id").inTable("dealers");
        table.enum("dealer_agreement", ["waiting", "accepted", "rejected"]).notNullable().defaultTo("waiting");
        table.uuid("admin_id").nullable().references("id").inTable("admins");
        table.enum("admin_agreement", ["waiting", "accepted", "rejected"]).notNullable().defaultTo("waiting");
        table.uuid("receipt_id").nullable().references("id").inTable("receipts");
        table.timestamp("date").defaultTo(knex.fn.now());
        table.double("price").notNullable();
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("agreements");
}

