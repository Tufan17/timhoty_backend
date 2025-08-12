import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("dealer_application", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.text("name_surname").notNullable(); // Başvuru sahibinin adı soyadı
    table.string("email").notNullable();
    table.string("phone").notNullable();
    table.text("dealer_name").notNullable(); // Bayi adı
    table.enum("type", ["individual", "company"]).defaultTo("company"); // Bireysel/Şirket
    table.string("identity_number").nullable(); // Bireysel için
    table.string("tax_office").nullable(); // Şirket için
    table.string("tax_number").nullable(); // Şirket için
    table.uuid("city_id").notNullable().references("id").inTable("cities");
    table.uuid("district_id").notNullable().references("id").inTable("districts");
    table.text("address").notNullable();
    table.string("bank_account_iban").nullable();
    table.string("bank_account_name").nullable();
    table.specificType("document_urls", "text[]").defaultTo("{}"); // Dosya linkleri
    table.boolean("verify").defaultTo(false);
    table.boolean("status").defaultTo(true);
    table.text("rejection_reason").nullable();
    table.string("created_at").defaultTo(knex.fn.now());
    table.string("updated_at").defaultTo(knex.fn.now());
    table.string("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("dealer_application");
}
