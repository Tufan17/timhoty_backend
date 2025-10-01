import type { Knex } from "knex";



export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("car_rental_reservation_users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("car_rental_reservation_id")
      .notNullable()
      .references("id")
      .inTable("car_rental_reservations")
      .onDelete("CASCADE");
    table.string("name").nullable();
    table.string("surname").nullable();
    table.string("birthday").nullable();
    table.string("email").nullable();
    table.string("phone").nullable();
    table.enu("type", ["adult", "child"]).nullable();
    table.string("age").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("car_rental_reservation_users");
}
