import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class HotelReservationInvoiceModel extends BaseModel {
  constructor() {
    super("hotel_reservation_invoices");
  }

  static columns = [
    'id',
    'hotel_reservation_id',
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

  async getInvoiceByHotelReservationId(hotelReservationId: string) {
    return await knex("hotel_reservation_invoices")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoiceByPaymentId(paymentId: string) {
    return await knex("hotel_reservation_invoices")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("hotel_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({ 
        payment_id: paymentId,
        updated_at: new Date() 
      });
  }

  async deleteByHotelReservationId(hotelReservationId: string) {
    await knex("hotel_reservation_invoices")
      .where("hotel_reservation_id", hotelReservationId)
      .whereNull("deleted_at")
      .update({ deleted_at: new Date() });
  }

  async getInvoiceWithReservationDetails(invoiceId: string) {
    return await knex("hotel_reservation_invoices")
      .leftJoin("hotel_reservations", "hotel_reservation_invoices.hotel_reservation_id", "hotel_reservations.id")
      .leftJoin("hotel_reservation_users", "hotel_reservations.id", "hotel_reservation_users.hotel_reservation_id")
      .leftJoin("users", "hotel_reservation_users.user_id", "users.id")
      .select(
        "hotel_reservation_invoices.*",
        "hotel_reservations.*",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.phone"
      )
      .where("hotel_reservation_invoices.id", invoiceId)
      .whereNull("hotel_reservation_invoices.deleted_at")
      .first();
  }
}

export default HotelReservationInvoiceModel;
