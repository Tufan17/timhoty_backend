import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("countries", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("phone_code", 5).notNullable();
    table.string("timezone").notNullable();
    table.string("flag").nullable();
    table.string("code").notNullable();
    table.uuid("currency_id").references("id").inTable("currencies").nullable();
    table.string("created_at").defaultTo(knex.fn.now());
    table.string("updated_at").defaultTo(knex.fn.now());
    table.string("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("countries");
}
