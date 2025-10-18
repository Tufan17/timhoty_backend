import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { tapPaymentsService } from "@/services/Payment";
import { title } from "process";
import HotelReservationModel from "@/models/HotelReservationModel";
import HotelReservationInvoiceModel from "@/models/HotelReservationInvoiceModel";
import HotelReservationUserModel from "@/models/HotelReservationUserModel";
import dotenv from "dotenv";
import path from "path";
import HotelReservationSpecialRequestModel from "@/models/HotelReservationSpecialRequestModel";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const SALE_PARTNER_FRONTEND_URL =
  process.env.SALE_PARTNER_FRONTEND_URL || "http://localhost:5173";
import DiscountUserModel from "@/models/DiscountUserModel";

interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: {
      country_code: string;
      number: string;
    };
  };
  hotel_id?: string;
  booking_id?: string;
  description?: string;
  redirect_url?: string;
  post_url?: string;
  users?: {
    id?: number;
    name: string;
    surname: string;
    birthDate: string;
    email: string;
    phone: string;
    type: string;
    age?: string | number;
  }[];
  package_id?: string;
  different_invoice?: boolean;
  special_requests?: string[];
  discount?:
    | number
    | {
        id: string;
        code: string;
        service_type: string;
        amount: string;
        percentage: string;
      };
  invoice_name: string;
  invoice_surname: string;
  invoice_address: string;
}

interface PaymentStatusRequest {
  charge_id: string;
}

interface RefundRequest {
  charge_id: string;
  amount?: number;
  reason?: string;
  description?: string;
}

class UserHotelPayment {
  /**
   * Create a payment charge for hotel booking
   */
  async createPaymentIntent(
    req: FastifyRequest<{ Body: CreatePaymentRequest }>,
    res: FastifyReply
  ) {
    try {
      const {
        amount,
        currency = "USD",
        customer,
        hotel_id,
        booking_id,
        description,
        start_date,
        end_date,
        users,
        package_id,
        special_requests,
        discount,
        invoice_name,
        invoice_surname,
        invoice_address,
      } = req.body;
      const salesPartner = (req as any).user;
      const salesPartnerId = salesPartner?.sales_partner_id;
      // Validate required fields
      if (!amount || amount <= 0) {
        return res.status(400).send({
          success: false,
          message: "Geçerli bir tutar giriniz",
        });
      }

      if (!customer.first_name || !customer.last_name || !customer.email) {
        return res.status(400).send({
          success: false,
          message: "Müşteri bilgileri eksik",
        });
      }

      if (!hotel_id) {
        return res.status(400).send({
          success: false,
          message: "Hotel ID is required",
        });
      }

      if (!users) {
        return res.status(400).send({
          success: false,
          message: "Müşteri bilgileri eksik",
        });
      }

      // Create charge request
      const chargeRequest = {
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: currency,
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        },
        description:
          description ||
          `Hotel booking payment - ${hotel_id ? `Hotel ID: ${hotel_id}` : ""}`,
        redirect: {
          url: `${SALE_PARTNER_FRONTEND_URL}/hotel-reservations/approve/${booking_id}`,
        },
        post: {
          url: `${SALE_PARTNER_FRONTEND_URL}/hotel-reservations/approve/${booking_id}`,
        },
        metadata: {
          hotel_id,
          booking_id,
          payment_type: "hotel_booking",
          created_at: new Date().toISOString(),
        },
      };

      const paymentIntent = await tapPaymentsService.createCharge(
        chargeRequest
      );
      const reservationModel = new HotelReservationModel();

      const existingReservation = await reservationModel.exists({
        progress_id: booking_id,
      });

      if (!existingReservation) {
        if (discount && typeof discount === "object" && discount.id) {
          const discountUserModel = new DiscountUserModel();
          await discountUserModel.create({
            discount_code_id: discount.id,
            status: false,
            payment_id: paymentIntent.id,
          });
        }
        const body_form = {
          payment_id: paymentIntent.id,
          different_invoice: false,
          hotel_id: hotel_id,
          package_id: package_id,
          status: false,
          progress_id: booking_id,
          start_date: start_date,
          end_date: end_date,
          price: Number(amount) * 100,
          sales_partner_id: salesPartnerId,
          currency_code: currency,
        };
        const reservation = await reservationModel.create(body_form);

        const body_invoice = {
          hotel_reservation_id: reservation.id,
          tax_office: invoice_address,
          title: invoice_name + " " + invoice_surname,
          tax_number: "",
          payment_id: paymentIntent.id,
          official: "individual",
          address: invoice_address,
        };

        const invoiceModel = new HotelReservationInvoiceModel();
        await invoiceModel.create(body_invoice);

        if (users && users.length > 0) {
          for (const user of users) {
            const body_user = {
              hotel_reservation_id: reservation.id,
              name: user.name,
              surname: user.surname,
              birthday: user.birthDate || null, // Geçerli tarih ya da null kaydı
              email: user.email || null,
              phone: user.phone || null,
              type: user.type,
              age:
                typeof user.age === "string"
                  ? parseInt(user.age)
                  : user.age || null,
            };
            const userModel = new HotelReservationUserModel();
            await userModel.create(body_user);
          }
        }
        if (special_requests && special_requests.length > 0) {
          for (const request of special_requests) {
            const body_request = {
              hotel_reservation_id: reservation.id,
              request: request, // Now handling string values directly
            };
            const requestModel = new HotelReservationSpecialRequestModel();
            await requestModel.create(body_request);
          }
        }
      }

      return res.status(200).send({
        success: true,
        message: "Payment intent created successfully",
        data: {
          charge_id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100, // Convert back to main currency unit
          currency: paymentIntent.currency,
          redirect_url: paymentIntent.redirect?.url,
          payment_url: paymentIntent.transaction?.url, // Tap Payments URL'si transaction.url'de
          created_at: paymentIntent.created
            ? new Date(paymentIntent.created * 1000).toISOString()
            : new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Hotel Payment Error:", error);
      return res.status(500).send({
        success: false,
        message: "Payment intent creation failed",
        error: error.message,
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    req: FastifyRequest<{ Params: PaymentStatusRequest }>,
    res: FastifyReply
  ) {
    try {
      const { charge_id } = req.params;

      if (!charge_id) {
        return res.status(400).send({
          success: false,
          message: "Charge ID is required",
        });
      }

      const charge = await tapPaymentsService.getCharge(charge_id);
      const reservationModel = new HotelReservationModel();
      const reservation = await reservationModel.getReservationByPaymentId(
        charge_id
      );
      if (!reservation) {
        return res.status(400).send({
          success: false,
          message: "Reservation not found",
        });
      }

      if (charge.status === "CAPTURED") {
        await reservationModel.update(reservation.id, { status: true });
        const discountUserModel = new DiscountUserModel();

        const existingDiscountUser = await discountUserModel.first({
          payment_id: charge_id,
        });
        if (existingDiscountUser) {
          await discountUserModel.update(existingDiscountUser.id, {
            status: true,
          });
        }
      }

      return res.status(200).send({
        success: true,
        message: "Payment status retrieved successfully",
        data: {
          charge_id: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          currency: charge.currency,
          customer: charge.customer,
          created_at: charge.created
            ? new Date(charge.created * 1000).toISOString()
            : new Date().toISOString(),
          url: charge.url,
        },
      });
    } catch (error: any) {
      console.error("Payment Status Error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve payment status",
        error: error.message,
      });
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    req: FastifyRequest<{ Body: RefundRequest }>,
    res: FastifyReply
  ) {
    try {
      const { charge_id, amount, reason, description } = req.body;

      if (!charge_id) {
        return res.status(400).send({
          success: false,
          message: "Charge ID is required",
        });
      }

      const refundRequest = {
        charge_id,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to smallest currency unit
        reason: reason || "requested_by_customer",
        description: description || "Hotel booking refund",
        metadata: {
          refund_type: "hotel_booking",
          created_at: new Date().toISOString(),
        },
      };

      const refund = await tapPaymentsService.createRefund(refundRequest);

      return res.status(200).send({
        success: true,
        message: "Refund created successfully",
        data: {
          refund_id: refund.id,
          status: refund.status,
          amount: refund.amount / 100,
          currency: refund.currency,
          charge_id: refund.charge_id,
          created_at: refund.created
            ? new Date(refund.created * 1000).toISOString()
            : new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Refund Error:", error);
      return res.status(500).send({
        success: false,
        message: "Refund creation failed",
        error: error.message,
      });
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(
    req: FastifyRequest<{ Params: { refund_id: string } }>,
    res: FastifyReply
  ) {
    try {
      const { refund_id } = req.params;

      if (!refund_id) {
        return res.status(400).send({
          success: false,
          message: "Refund ID is required",
        });
      }

      const refund = await tapPaymentsService.getRefund(refund_id);

      return res.status(200).send({
        success: true,
        message: "Refund status retrieved successfully",
        data: {
          refund_id: refund.id,
          status: refund.status,
          amount: refund.amount / 100,
          currency: refund.currency,
          charge_id: refund.charge_id,
          created_at: refund.created
            ? new Date(refund.created * 1000).toISOString()
            : new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Refund Status Error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve refund status",
        error: error.message,
      });
    }
  }

  /**
   * List payment charges
   */
  async listCharges(
    req: FastifyRequest<{
      Querystring: { limit?: number; starting_after?: string };
    }>,
    res: FastifyReply
  ) {
    try {
      const { limit = 25, starting_after } = req.query;

      const charges = await tapPaymentsService.listCharges(
        limit,
        starting_after
      );

      return res.status(200).send({
        success: true,
        message: "Charges retrieved successfully",
        data: charges,
      });
    } catch (error: any) {
      console.error("List Charges Error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve charges",
        error: error.message,
      });
    }
  }
}

export default UserHotelPayment;
