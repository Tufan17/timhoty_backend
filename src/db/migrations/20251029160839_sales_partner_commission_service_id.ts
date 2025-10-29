import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("sales_partner_commissions", (table) => {
    table.uuid("service_id").nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("sales_partner_commissions", (table) => {
    table.dropColumn("service_id");
  });
}

