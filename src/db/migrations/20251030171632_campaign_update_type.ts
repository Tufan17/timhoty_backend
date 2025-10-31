import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Eski constraint'i kaldır
  await knex.schema.raw(`
    ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS campaigns_service_type_check;
  `);

  // Yeni constraint ekle
  await knex.schema.raw(`
    ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_service_type_check
    CHECK (service_type IN ('hotel', 'rental', 'activity', 'tour', 'visa', 'sales_partner'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Önce sales_partner kayıtlarını temizle
  await knex.schema.raw(`
    UPDATE campaigns
    SET service_type = 'hotel'
    WHERE service_type = 'sales_partner';
  `);

  // Constraint'i kaldır
  await knex.schema.raw(`
    ALTER TABLE campaigns
    DROP CONSTRAINT IF EXISTS campaigns_service_type_check;
  `);

  // Eski constraint'i geri koy
  await knex.schema.raw(`
    ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_service_type_check
    CHECK (service_type IN ('hotel', 'rental', 'activity', 'tour', 'visa'));
  `);
}
