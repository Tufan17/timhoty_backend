import type { Knex } from "knex";



export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("comments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.enum("service_type", ["hotel", "car_rental", "activity", "tour", "visa"]).notNullable().defaultTo("hotel");
    table.uuid("service_id").notNullable();
    table.uuid("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.uuid("reservation_id").notNullable();
    table.text("comment").notNullable();
    table.float("rating").notNullable();
    table.string("language_code").notNullable().defaultTo("en");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("comments");
}
