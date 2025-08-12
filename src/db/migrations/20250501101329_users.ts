import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string("name_surname").nullable();
    table.string("tc_no").notNullable().unique();
    table.string("email").nullable().unique();
    table.string("phone").notNullable();
    table.uuid("job_id").nullable().references("id").inTable("jobs");
    table.uuid("dealer_id").nullable().references("id").inTable("dealers");
    table.string("device_id").nullable();
    table.boolean("email_verification").defaultTo(false);
    table.string("otp_code").nullable();
    table.timestamp("otp_code_expired_at").nullable();
    table.boolean('verify').notNullable();
    table.boolean("status").defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.timestamp("deleted_at").nullable();
  });
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}

