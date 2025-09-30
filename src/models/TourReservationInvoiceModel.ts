import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class TourReservationInvoiceModel extends BaseModel {
  constructor() {
    super("tour_reservation_invoices");
  }

  static columns = [
    "id",
    "tour_reservation_id",
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

  async getInvoiceByTourReservationId(tourReservationId: string) {
    return await knex("tour_reservation_invoices")
      .where("tour_reservation_id", tourReservationId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoiceByPaymentId(paymentId: string) {
    return await knex("tour_reservation_invoices")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("tour_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        payment_id: paymentId,
        updated_at: new Date(),
      });
  }

  async deleteByTourReservationId(tourReservationId: string) {
    await knex("tour_reservation_invoices")
      .where("tour_reservation_id", tourReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getInvoiceWithReservationDetails(invoiceId: string) {
    return await knex("tour_reservation_invoices")
      .leftJoin(
        "tour_reservations",
        "tour_reservation_invoices.tour_reservation_id",
        "tour_reservations.id"
      )
      .leftJoin(
        "tour_reservation_users",
        "tour_reservations.id",
        "tour_reservation_users.tour_reservation_id"
      )
      .leftJoin("users", "tour_reservation_users.id", "users.id")
      .select(
        "tour_reservation_invoices.*",
        "tour_reservations.*",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.phone"
      )
      .where("tour_reservation_invoices.id", invoiceId)
      .whereNull("tour_reservation_invoices.deleted_at")
      .first();
  }

  async getInvoicesByTaxNumber(taxNumber: string) {
    return await knex("tour_reservation_invoices")
      .where("tax_number", taxNumber)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getInvoicesByTaxOffice(taxOffice: string) {
    return await knex("tour_reservation_invoices")
      .where("tax_office", taxOffice)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async updateInvoiceInfo(id: string, invoiceData: any) {
    return await knex("tour_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        ...invoiceData,
        updated_at: new Date(),
      });
  }

  async getInvoiceStats() {
    const total = await knex("tour_reservation_invoices")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const withPayment = await knex("tour_reservation_invoices")
      .whereNotNull("payment_id")
      .whereNull("deleted_at")
      .count("id as with_payment")
      .first();

    const withoutPayment = await knex("tour_reservation_invoices")
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
    let query = knex("tour_reservation_invoices")
      .leftJoin(
        "tour_reservations",
        "tour_reservation_invoices.tour_reservation_id",
        "tour_reservations.id"
      )
      .leftJoin("tours", "tour_reservations.tour_id", "tours.id")
      .leftJoin("tour_pivots", function () {
        this.on("tours.id", "=", "tour_pivots.tour_id").andOn(
          "tour_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "tour_packages",
        "tour_reservations.package_id",
        "tour_packages.id"
      )
      .leftJoin(
        "tour_package_prices",
        "tour_packages.id",
        "tour_package_prices.tour_package_id"
      )
      .leftJoin(
        "currencies",
        "tour_package_prices.currency_id",
        "currencies.id"
      )
      .select(
        "tour_reservation_invoices.*",
        "tour_reservations.status as reservation_status",
        "tour_reservations.created_at as reservation_date",
        "tour_pivots.title as tour_title",
        "tour_package_prices.price as package_price",
        "currencies.code as currency_code",
        "currencies.symbol as currency_symbol"
      )
      .whereNull("tour_reservation_invoices.deleted_at")
      .orderBy("tour_reservation_invoices.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }
}

export default TourReservationInvoiceModel;
