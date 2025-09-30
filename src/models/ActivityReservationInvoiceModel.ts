import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class ActivityReservationInvoiceModel extends BaseModel {
  constructor() {
    super("activity_reservation_invoices");
  }

  static columns = [
    "id",
    "activity_reservation_id",
    "payment_id",
    "tax_office",
    "title",
    "tax_number",
    "official",
    "address",
    "created_at",
    "updated_at",
    "deleted_at",
  ];

  async getInvoiceByActivityReservationId(activityReservationId: string) {
    return await knex("activity_reservation_invoices")
      .where("activity_reservation_id", activityReservationId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoiceByPaymentId(paymentId: string) {
    return await knex("activity_reservation_invoices")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("activity_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        payment_id: paymentId,
        updated_at: new Date(),
      });
  }

  async deleteByActivityReservationId(activityReservationId: string) {
    await knex("activity_reservation_invoices")
      .where("activity_reservation_id", activityReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getInvoiceWithReservationDetails(invoiceId: string) {
    return await knex("activity_reservation_invoices")
      .leftJoin(
        "activity_reservations",
        "activity_reservation_invoices.activity_reservation_id",
        "activity_reservations.id"
      )
      .leftJoin(
        "activity_reservation_users",
        "activity_reservations.id",
        "activity_reservation_users.activity_reservation_id"
      )
      .leftJoin("users", "activity_reservation_users.id", "users.id")
      .select(
        "activity_reservation_invoices.*",
        "activity_reservations.*",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.phone"
      )
      .where("activity_reservation_invoices.id", invoiceId)
      .whereNull("activity_reservation_invoices.deleted_at")
      .first();
  }

  async getInvoicesByTaxNumber(taxNumber: string) {
    return await knex("activity_reservation_invoices")
      .where("tax_number", taxNumber)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getInvoicesByTaxOffice(taxOffice: string) {
    return await knex("activity_reservation_invoices")
      .where("tax_office", taxOffice)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async updateInvoiceInfo(id: string, invoiceData: any) {
    return await knex("activity_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...invoiceData,
        updated_at: new Date(),
      });
  }

  async getInvoiceStats() {
    const total = await knex("activity_reservation_invoices")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const withPayment = await knex("activity_reservation_invoices")
      .whereNotNull("payment_id")
      .whereNull("deleted_at")
      .count("id as with_payment")
      .first();

    const withoutPayment = await knex("activity_reservation_invoices")
      .whereNull("payment_id")
      .whereNull("deleted_at")
      .count("id as without_payment")
      .first();

    return {
      total: total?.total || 0,
      with_payment: withPayment?.with_payment || 0,
      without_payment: withoutPayment?.without_payment || 0,
    };
  }

  async getInvoicesWithReservationDetails(limit?: number, offset?: number) {
    let query = knex("activity_reservation_invoices")
      .leftJoin(
        "activity_reservations",
        "activity_reservation_invoices.activity_reservation_id",
        "activity_reservations.id"
      )
      .leftJoin("activities", "activity_reservations.activity_id", "activities.id")
      .leftJoin("activity_pivots", function () {
        this.on("activities.id", "=", "activity_pivots.activity_id").andOn(
          "activity_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "activity_packages",
        "activity_reservations.package_id",
        "activity_packages.id"
      )
      .leftJoin(
        "activity_package_pivots",
        function () {
          this.on("activity_packages.id", "=", "activity_package_pivots.activity_package_id")
            .andOn("activity_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin(
        "activity_package_hours",
        "activity_reservations.activity_package_hour_id",
        "activity_package_hours.id"
      )
      .select(
        "activity_reservation_invoices.*",
        "activity_reservations.status as reservation_status",
        "activity_reservations.created_at as reservation_date",
        "activity_pivots.title as activity_title",
        "activity_package_pivots.name as package_name",
        "activity_package_hours.hour as activity_hour"
      )
      .whereNull("activity_reservation_invoices.deleted_at")
      .orderBy("activity_reservation_invoices.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }
}

export default ActivityReservationInvoiceModel;
