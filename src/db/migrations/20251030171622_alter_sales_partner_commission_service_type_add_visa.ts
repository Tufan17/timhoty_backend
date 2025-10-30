import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  // Update the check constraint to include 'visa'
  await knex.schema.raw(`
    ALTER TABLE sales_partner_commissions 
    DROP CONSTRAINT IF EXISTS sales_partner_commissions_service_type_check;
  `);
  
  await knex.schema.raw(`
    ALTER TABLE sales_partner_commissions 
    ADD CONSTRAINT sales_partner_commissions_service_type_check 
    CHECK (service_type = ANY (ARRAY['hotel'::text, 'rental'::text, 'activity'::text, 'tour'::text, 'visa'::text]));
  `);
}


export async function down(knex: Knex): Promise<void> {
  // Revert to original constraint without 'visa'
  await knex.schema.raw(`
    ALTER TABLE sales_partner_commissions 
    DROP CONSTRAINT IF EXISTS sales_partner_commissions_service_type_check;
  `);
  
  await knex.schema.raw(`
    ALTER TABLE sales_partner_commissions 
    ADD CONSTRAINT sales_partner_commissions_service_type_check 
    CHECK (service_type = ANY (ARRAY['hotel'::text, 'rental'::text, 'activity'::text, 'tour'::text]));
  `);
}
