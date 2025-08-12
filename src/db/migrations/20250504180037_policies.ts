import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("policies", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.uuid("offer_id").notNullable().references("id").inTable("offers");
    table
      .uuid("company_id")
      .notNullable()
      .references("id")
      .inTable("companies");
    table.uuid("user_id").notNullable().references("id").inTable("users");
    table
      .uuid("insurance_type_id")
      .notNullable()
      .references("id")
      .inTable("insurance_types");
    table
      .uuid("canceled_policy_id")
      .nullable()
      .references("id")
      .inTable("canceled_policies");
    table.uuid("dealer_id").nullable().references("id").inTable("dealers");
    table.string("policy_number").notNullable();
    table.string("commission_price").notNullable();
    table.string("file_url").nullable();
    table.boolean("status").defaultTo(false);
    table.timestamp("start_date").defaultTo(knex.fn.now());
    table.timestamp("end_date").defaultTo(knex.fn.now());
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("policies");
}
