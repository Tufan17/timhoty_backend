import type { Knex } from "knex";



export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("hotel_reservation_special_requests", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("hotel_reservation_id")
      .notNullable()
      .references("id")
      .inTable("hotel_reservations")
      .onDelete("CASCADE");
    table.integer("request").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("hotel_reservation_special_requests");
}
