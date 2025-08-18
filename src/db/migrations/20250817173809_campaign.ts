import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable("campaigns", (table) => {
        table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
        table.string("start_date").notNullable();
        table.string("end_date").notNullable();
        table.string("photo_url").notNullable();
        table.enum("service_type", ["hotel", "rental", "activity", "tour"]).notNullable().defaultTo("hotel");
        table.boolean("highlight").notNullable().defaultTo(false);
        table.boolean("status").notNullable().defaultTo(true);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("updated_at").defaultTo(knex.fn.now());
        table.timestamp("deleted_at").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable("campaigns");
}

