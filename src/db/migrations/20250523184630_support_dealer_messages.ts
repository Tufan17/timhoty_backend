import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("support_dealer_messages", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("ticket_id")
      .notNullable()
      .references("id")
      .inTable("support_dealer")
      .onDelete("CASCADE");

    table.text("message").notNullable();
    table.string("docs").nullable();

    // Gönderen kişi admin mi bayi mi
    table.enum("sender_type", ["admin", "dealer_user"]).notNullable();
    table.uuid("sender_id").notNullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("support_dealer_messages");
}
