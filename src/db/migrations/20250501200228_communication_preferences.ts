import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("communication_preferences", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid("user_id").unique().notNullable().references("id").inTable("users");
        table.boolean("email").defaultTo(false);
        table.boolean("sms").defaultTo(false);
        table.boolean("push").defaultTo(false);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("communication_preferences");
}

