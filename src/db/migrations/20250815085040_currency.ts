import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("currencies", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("code", 5).notNullable().unique(); // USD, EUR, TRY gibi ISO 4217 kodları
    table.string("symbol", 10).notNullable(); // $, €, ₺
    table.boolean("is_active").defaultTo(true); // Aktif mi
    table.enum("position", ["before", "after"]).defaultTo("before"); // Sembol pozisyonu: before/after
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("currencies");
}
