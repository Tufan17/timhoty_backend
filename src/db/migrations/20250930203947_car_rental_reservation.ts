import type { Knex } from "knex";
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("car_rental_reservations", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("car_rental_id")
      .notNullable()
      .references("id")
      .inTable("car_rentals")
      .onDelete("CASCADE");
    table
      .uuid("package_id")
      .notNullable()
      .references("id")
      .inTable("car_rental_packages")
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
    table.string("start_date").notNullable();
    table.string("end_date").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("car_rental_reservations");
}
