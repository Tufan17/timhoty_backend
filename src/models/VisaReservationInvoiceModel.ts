import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class VisaReservationInvoiceModel extends BaseModel {
  constructor() {
    super("visa_reservation_invoices");
  }

  static columns = [
    'id',
    'visa_reservation_id',
    'payment_id',
    'tax_office',
    'title',
    'tax_number',
    'official',
    'address',
    'created_at',
    'updated_at',
    'deleted_at',
  ];

  async getInvoiceByVisaReservationId(visaReservationId: string) {
    return await knex("visa_reservation_invoices")
      .where("visa_reservation_id", visaReservationId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoiceByPaymentId(paymentId: string) {
    return await knex("visa_reservation_invoices")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("visa_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({ 
        payment_id: paymentId,
        updated_at: new Date() 
      });
  }

  async deleteByVisaReservationId(visaReservationId: string) {
    await knex("visa_reservation_invoices")
      .where("visa_reservation_id", visaReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getInvoiceWithReservationDetails(invoiceId: string) {
    return await knex("visa_reservation_invoices")
      .leftJoin("visa_reservations", "visa_reservation_invoices.visa_reservation_id", "visa_reservations.id")
      .leftJoin("visa_reservation_users", "visa_reservations.id", "visa_reservation_users.visa_reservation_id")
      .leftJoin("users", "visa_reservation_users.id", "users.id")
      .select(
        "visa_reservation_invoices.*",
        "visa_reservations.*",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.phone"
      )
      .where("visa_reservation_invoices.id", invoiceId)
      .whereNull("visa_reservation_invoices.deleted_at")
      .first();
  }
}

export default VisaReservationInvoiceModel;
