import BaseModel from "@/models/BaseModel";
import knex from "@/db/knex";

class CarRentalReservationInvoiceModel extends BaseModel {
  constructor() {
    super("car_rental_reservation_invoices");
  }

  static columns = [
    "id",
    "car_rental_reservation_id",
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

  async getInvoiceByReservationId(reservationId: string) {
    return await knex("car_rental_reservation_invoices")
      .where("car_rental_reservation_id", reservationId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoiceByPaymentId(paymentId: string) {
    return await knex("car_rental_reservation_invoices")
      .where("payment_id", paymentId)
      .whereNull("deleted_at")
      .first();
  }

  async getInvoicesByTaxNumber(taxNumber: string) {
    return await knex("car_rental_reservation_invoices")
      .where("tax_number", taxNumber)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getInvoicesByOfficial(official: string) {
    return await knex("car_rental_reservation_invoices")
      .where("official", official)
      .whereNull("deleted_at")
      .orderBy("created_at", "desc");
  }

  async getInvoiceWithReservationDetails(invoiceId: string) {
    return await knex("car_rental_reservation_invoices")
      .leftJoin(
        "car_rental_reservations",
        "car_rental_reservation_invoices.car_rental_reservation_id",
        "car_rental_reservations.id"
      )
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "car_rental_packages",
        "car_rental_reservations.package_id",
        "car_rental_packages.id"
      )
      .leftJoin(
        "car_rental_package_pivots",
        function () {
          this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
            .andOn("car_rental_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin("users", "car_rental_reservations.created_by", "users.id")
      .select(
        "car_rental_reservation_invoices.*",
        "car_rental_reservations.progress_id",
        "car_rental_reservations.start_date",
        "car_rental_reservations.end_date",
        "car_rental_reservations.price",
        "car_rental_reservations.currency_code",
        "car_rental_pivots.title as car_rental_title",
        "car_rental_package_pivots.name as package_name",
        "users.first_name",
        "users.last_name",
        "users.email as user_email"
      )
      .where("car_rental_reservation_invoices.id", invoiceId)
      .whereNull("car_rental_reservation_invoices.deleted_at")
      .first();
  }

  async getInvoicesWithReservationDetails(
    where?: any,
    limit?: number,
    offset?: number
  ) {
    let query = knex("car_rental_reservation_invoices")
      .leftJoin(
        "car_rental_reservations",
        "car_rental_reservation_invoices.car_rental_reservation_id",
        "car_rental_reservations.id"
      )
      .leftJoin("car_rentals", "car_rental_reservations.car_rental_id", "car_rentals.id")
      .leftJoin("car_rental_pivots", function () {
        this.on("car_rentals.id", "=", "car_rental_pivots.car_rental_id").andOn(
          "car_rental_pivots.language_code",
          "=",
          "en"
        );
      })
      .leftJoin(
        "car_rental_packages",
        "car_rental_reservations.package_id",
        "car_rental_packages.id"
      )
      .leftJoin(
        "car_rental_package_pivots",
        function () {
          this.on("car_rental_packages.id", "=", "car_rental_package_pivots.car_rental_package_id")
            .andOn("car_rental_package_pivots.language_code", "=", "en");
        }
      )
      .leftJoin("users", "car_rental_reservations.created_by", "users.id")
      .select(
        "car_rental_reservation_invoices.*",
        "car_rental_reservations.progress_id",
        "car_rental_reservations.start_date",
        "car_rental_reservations.end_date",
        "car_rental_reservations.price",
        "car_rental_reservations.currency_code",
        "car_rental_pivots.title as car_rental_title",
        "car_rental_package_pivots.name as package_name",
        "users.first_name",
        "users.last_name",
        "users.email as user_email"
      )
      .whereNull("car_rental_reservation_invoices.deleted_at");

    if (where) {
      query = query.where(where);
    }

    query = query.orderBy("car_rental_reservation_invoices.created_at", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.offset(offset);
    }

    return await query;
  }

  async getInvoiceStats() {
    const total = await knex("car_rental_reservation_invoices")
      .whereNull("deleted_at")
      .count("id as total")
      .first();

    const individual = await knex("car_rental_reservation_invoices")
      .where("official", "individual")
      .whereNull("deleted_at")
      .count("id as individual")
      .first();

    const corporate = await knex("car_rental_reservation_invoices")
      .where("official", "corporate")
      .whereNull("deleted_at")
      .count("id as corporate")
      .first();

    const withTaxNumber = await knex("car_rental_reservation_invoices")
      .whereNotNull("tax_number")
      .where("tax_number", "!=", "")
      .whereNull("deleted_at")
      .count("id as with_tax_number")
      .first();

    return {
      total: total?.total || 0,
      individual: individual?.individual || 0,
      corporate: corporate?.corporate || 0,
      with_tax_number: withTaxNumber?.with_tax_number || 0,
    };
  }

  async updatePaymentId(id: string, paymentId: string) {
    return await knex("car_rental_reservation_invoices")
      .where("id", id)
      .whereNull("deleted_at")
      .update({
        payment_id: paymentId,
        updated_at: new Date(),
      });
  }

  async getInvoicesByDateRange(startDate: string, endDate: string) {
    return await knex("car_rental_reservation_invoices")
      .leftJoin(
        "car_rental_reservations",
        "car_rental_reservation_invoices.car_rental_reservation_id",
        "car_rental_reservations.id"
      )
      .whereBetween("car_rental_reservations.start_date", [startDate, endDate])
      .whereNull("car_rental_reservation_invoices.deleted_at")
      .orderBy("car_rental_reservation_invoices.created_at", "desc");
  }
}

export default CarRentalReservationInvoiceModel;
