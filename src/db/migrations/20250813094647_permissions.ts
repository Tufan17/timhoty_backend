import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("permissions", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string("name").notNullable();
        table.enum("target", ["users", "admins","solution_partner","sale_partner"]).notNullable();
        table.uuid("target_id").notNullable();
        table.boolean("status").defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    }); 
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable("permissions");
}

