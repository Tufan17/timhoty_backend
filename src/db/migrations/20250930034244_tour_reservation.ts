import type { Knex } from "knex";
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("tour_reservations", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("tour_id")
      .notNullable()
      .references("id")
      .inTable("tours")
      .onDelete("CASCADE");
    table
      .uuid("package_id")
      .notNullable()
      .references("id")
      .inTable("tour_packages")
      .onDelete("CASCADE");
    table
      .uuid("created_by")
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("sales_partner_id")
      .nullable()
      .references("id")
      .inTable("sales_partners")
      .onDelete("CASCADE");

    table.string("progress_id").notNullable();
    table.double("price").notNullable();
    table.string("currency_code").notNullable();
    table.string("payment_id").nullable();
    table.boolean("different_invoice").notNullable().defaultTo(false);
    table.boolean("status").notNullable().defaultTo(false);
    table.string("period").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("tour_reservations");
}
