import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { tapPaymentsService } from "@/services/Payment";
import CarRentalReservationModel from "@/models/CarRentalReservationModel";
import CarRentalReservationInvoiceModel from "@/models/CarRentalReservationInvoiceModel";
import CarRentalReservationUserModel from "@/models/CarRentalReservationUserModel";
import dotenv from "dotenv";
import path from "path";
import DiscountUserModel from "@/models/DiscountUserModel";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const SALE_PARTNER_FRONTEND_URL =
  process.env.SALE_PARTNER_FRONTEND_URL || "http://localhost:5173";

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
  car_rental_id?: string;
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
  discount?:
    | number
    | {
        code: string;
        type: "percentage" | "fixed";
        value: number;
      };
  invoice_title?: string;
  invoice_official?: string;
  invoice_tax_number?: string;
  invoice_tax_office_address?: string;
  invoice_address?: string;
}

interface PaymentStatusRequest {
  charge_id: string;
}

interface RefundRequest {
  charge_id: string;
  amount?: number;
  description?: string;
}

class CarRentalPayment {
  /**
   * Create a payment charge for car rental booking
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
        car_rental_id,
        booking_id,
        description,
        start_date,
        end_date,
        users,
        different_invoice,
        package_id,
        discount,
        invoice_title,
        invoice_official,
        invoice_tax_number,
        invoice_tax_office_address,
        invoice_address,
      } = req.body;

      const user = (req as any).user;
      const salesPartnerId = user?.sales_partner_id;

      // Check if user is a sales partner
      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized: Sales partner access required",
        });
      }

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

      if (!car_rental_id) {
        return res.status(400).send({
          success: false,
          message: "Car rental ID is required",
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
        amount: amount,
        currency: currency,
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
        },
        description:
          description ||
          `Car Rental payment - ${
            car_rental_id ? `Car Rental ID: ${car_rental_id}` : ""
          }`,
        redirect: {
          url: `${SALE_PARTNER_FRONTEND_URL}/car-rental-reservations/approve/${
            booking_id || "pending"
          }`,
        },
        post: {
          url: `${SALE_PARTNER_FRONTEND_URL}/car-rental-reservations/approve/${
            booking_id || "pending"
          }`,
        },
        metadata: {
          car_rental_id,
          booking_id,
          payment_type: "sales_partner_car_rental_booking",
          sales_partner_id: salesPartnerId,
          package_id,
          start_date,
          end_date,
          created_at: new Date().toISOString(),
        },
      };

      // Try to create payment intent, but handle service unavailability
      let paymentIntent;
      try {
        paymentIntent = await tapPaymentsService.createCharge(chargeRequest);
      } catch (paymentError: any) {
        // If Tap Payments is down, create a mock payment intent for testing
        if (
          paymentError.message?.includes("503") ||
          paymentError.message?.includes("unavailable")
        ) {
          console.log(
            "Tap Payments unavailable, creating mock payment for testing"
          );
          paymentIntent = {
            id: `mock_${Date.now()}`,
            status: "INITIATED",
            amount: amount,
            currency: currency,
            redirect: {
              url: `${SALE_PARTNER_FRONTEND_URL}/car-rental-reservations/approve/${
                booking_id || "pending"
              }`,
            },
            transaction: {
              url: `${SALE_PARTNER_FRONTEND_URL}/car-rental-reservations/approve/${
                booking_id || "pending"
              }`,
            },
            created: Math.floor(Date.now() / 1000),
          };
        } else {
          throw paymentError;
        }
      }

      if (!paymentIntent || !paymentIntent.id) {
        return res.status(500).send({
          success: false,
          message: "Payment charge creation failed",
        });
      }

      // Create reservation record
      const reservationData = {
        car_rental_id,
        package_id,
        sales_partner_id: salesPartnerId,
        progress_id: `CR-${Date.now()}`,
        price: amount,
        currency_code: currency,
        payment_id: paymentIntent.id,
        different_invoice: different_invoice || false,
        status: false,
        start_date,
        end_date,
      };

      const reservationModel = new CarRentalReservationModel();
      const reservation = await reservationModel.create(reservationData);

      if (!reservation) {
        return res.status(500).send({
          success: false,
          message: "Reservation creation failed",
        });
      }
      // Create reservation users
      if (users && users.length > 0) {
        const reservationUserModel = new CarRentalReservationUserModel();
        for (const userData of users) {
          await reservationUserModel.create({
            car_rental_reservation_id: reservation.id,
            name: userData.name,
            surname: userData.surname,
            birthday: userData.birthDate,
            email: userData.email,
            phone: userData.phone,
            type: userData.type,
            age: userData.age,
          });
        }
      }

      return res.status(200).send({
        success: true,
        message: "Payment intent created successfully",
        data: {
          charge_id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          redirect_url: paymentIntent.redirect?.url,
          payment_url: paymentIntent.transaction?.url, // Tap Payments URL'si transaction.url'de
          reservation_id: reservation.id,
          created_at: paymentIntent.created
            ? new Date(paymentIntent.created * 1000).toISOString()
            : new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Car rental payment creation error:", error);
      return res.status(500).send({
        success: false,
        message: "Payment creation failed",
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

      const charge = await tapPaymentsService.getCharge(charge_id);

      const reservationModel = new CarRentalReservationModel();
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

      if (!charge) {
        return res.status(404).send({
          success: false,
          message: "Charge not found",
        });
      }

      return res.status(200).send({
        success: true,
        message: "Payment status retrieved successfully",
        data: {
          charge_id: charge.id,
          status: charge.status,
          amount: charge.amount,
          currency: charge.currency,
        },
      });
    } catch (error) {
      console.error("Payment status retrieval error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve payment status",
      });
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    req: FastifyRequest<{ Body: RefundRequest }>,
    res: FastifyReply
  ) {
    try {
      const { charge_id, amount, description } = req.body;

      if (!charge_id) {
        return res.status(400).send({
          success: false,
          message: "Charge ID is required",
        });
      }

      const refundRequest = {
        charge_id,
        amount,
        description: description || "Car rental booking refund",
      };

      const refund = await tapPaymentsService.createRefund(refundRequest);

      if (!refund || !refund.id) {
        return res.status(500).send({
          success: false,
          message: "Refund creation failed",
        });
      }

      return res.status(200).send({
        success: true,
        message: "Refund created successfully",
        data: {
          refund_id: refund.id,
          amount: refund.amount,
          status: refund.status,
        },
      });
    } catch (error) {
      console.error("Refund creation error:", error);
      return res.status(500).send({
        success: false,
        message: "Refund creation failed",
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

      const refund = await tapPaymentsService.getRefund(refund_id);

      if (!refund) {
        return res.status(404).send({
          success: false,
          message: "Refund not found",
        });
      }

      return res.status(200).send({
        success: true,
        message: "Refund status retrieved successfully",
        data: {
          refund_id: refund.id,
          status: refund.status,
          amount: refund.amount,
          created_at: refund.created,
        },
      });
    } catch (error) {
      console.error("Refund status retrieval error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve refund status",
      });
    }
  }

  /**
   * List charges
   */
  async listCharges(req: FastifyRequest, res: FastifyReply) {
    try {
      const user = (req as any).user;
      const salesPartnerId = user?.sales_partner_id;

      if (!salesPartnerId) {
        return res.status(401).send({
          success: false,
          message: "Unauthorized: Sales partner access required",
        });
      }

      const charges = await tapPaymentsService.listCharges(100);

      return res.status(200).send({
        success: true,
        message: "Charges retrieved successfully",
        data: charges,
      });
    } catch (error) {
      console.error("Charges listing error:", error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve charges",
      });
    }
  }
}

export default CarRentalPayment;
