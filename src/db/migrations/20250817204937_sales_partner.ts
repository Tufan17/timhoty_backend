
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("sales_partners", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("location_id").notNullable().references("id").inTable("cities");
    table.string("name").notNullable();
    table.string("phone").notNullable();
    table.string("whatsapp_no").nullable();
    table.string("telegram_no").nullable();
    table.string("address").nullable();
    table.string("tax_office").nullable();
    table.string("tax_number").nullable();
    table.string("bank_name").nullable();
    table.string("swift_number").nullable();
    table.string("account_owner").nullable();
    table.string("iban").nullable();
    table.string("language_code").notNullable();
    table.boolean("admin_verified").notNullable().defaultTo(false);
    table
      .uuid("application_status_id")
      .nullable()
      .references("id")
      .inTable("application_status");
    table.boolean("status").notNullable().defaultTo(false);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("sales_partners");
}
