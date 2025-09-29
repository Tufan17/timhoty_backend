import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("visa_reservation_invoices", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("visa_reservation_id")
      .notNullable()
      .references("id")
      .inTable("visa_reservations")
      .onDelete("CASCADE");
    table.string("payment_id").nullable();
    
    table.string("tax_office").nullable();
    table.string("title").nullable();
    table.string("tax_number").nullable();
    table.string("official").nullable();
    table.string("address").nullable();
    
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("visa_reservation_invoices");
}
