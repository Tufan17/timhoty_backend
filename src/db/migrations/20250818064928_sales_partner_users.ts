import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("sales_partner_users", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.uuid("sales_partner_id").notNullable().references("id").inTable("sales_partners");
        table.enum("type", ["manager", "worker"]).notNullable().defaultTo("worker");
        table.string("name_surname").notNullable();
        table.string("phone").notNullable();
        table.string("email").notNullable();
        table.string("password").notNullable();
        table.string("language_code").notNullable().defaultTo("en");    
        table.boolean("status").notNullable().defaultTo(true);
        table.string("created_at").defaultTo(knex.fn.now());
        table.string("updated_at").defaultTo(knex.fn.now());
        table.string("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("sales_partner_users");
}

