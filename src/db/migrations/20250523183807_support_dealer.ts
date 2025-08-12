import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("support_dealer", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("title").notNullable();
    table.text("description").notNullable();

    table.uuid("dealer_id").notNullable().references("id").inTable("dealers");
    table
      .uuid("dealer_user_id")
      .nullable()
      .references("id")
      .inTable("dealer_users");
    table.uuid("admin_id").nullable().references("id").inTable("admins");

    table.string("docs").nullable();
    table.enum("status", ["waiting", "open", "closed", "pending"]).notNullable().defaultTo("waiting"); // waiting, open, closed, pending vs.
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("support_dealer");
}
