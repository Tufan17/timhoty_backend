// src/db/migrations/20250505120000_landing.ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("landing", (table) => {
    // UUID primary key
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    // Model’de tanımlı sütunlar
    table.string("title").notNullable();
    table.text("description").nullable();
    table.string("platform").notNullable();
    table.string("image").nullable();

    // Zaman damgaları
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("landing");
}