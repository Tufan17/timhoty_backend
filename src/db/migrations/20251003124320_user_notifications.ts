import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_notifications", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("notification_id")
      .nullable()
      .references("id")
      .inTable("notifications")
      .onDelete("CASCADE");
    table.enum("target_type", ["admin", "solution_partner_users", "sale_partner_users", "users"]).notNullable();
    table.uuid("target_id").notNullable();
    table.text("title").nullable();
    table.text("message").nullable();
    table.string("link").nullable();

    
    table.boolean("is_read").defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_notifications");
}
