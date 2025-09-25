import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { tapPaymentsService } from "@/services/Payment";

interface CreatePaymentRequest {
  amount: number;
  currency?: string;
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

class UserCarRentalPayment {
  /**
   * Create a payment charge for car rental booking
   */
  async createPaymentIntent(req: FastifyRequest<{ Body: CreatePaymentRequest }>, res: FastifyReply) {
    try {
      const { amount, currency = 'USD', customer, car_rental_id, booking_id, description, redirect_url, post_url } = req.body;

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

      // Create charge request
      const chargeRequest = {
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        currency: currency,
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone
        },
        description: description || `Car rental payment - ${car_rental_id ? `Car Rental ID: ${car_rental_id}` : ''}`,
        redirect: redirect_url ? { url: redirect_url } : undefined,
        post: post_url ? { url: post_url } : undefined,
        metadata: {
          car_rental_id,
          booking_id,
          payment_type: 'car_rental_booking',
          created_at: new Date().toISOString()
        }
      };

      const paymentIntent = await tapPaymentsService.createCharge(chargeRequest);

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
          created_at: paymentIntent.created ? new Date(paymentIntent.created * 1000).toISOString() : new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Car Rental Payment Error:', error);
      return res.status(500).send({
        success: false,
        message: "Payment intent creation failed",
        error: error.message
      });
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(req: FastifyRequest<{ Params: PaymentStatusRequest }>, res: FastifyReply) {
    try {
      const { charge_id } = req.params;

      if (!charge_id) {
        return res.status(400).send({
          success: false,
          message: "Charge ID is required",
        });
      }

      const charge = await tapPaymentsService.getCharge(charge_id);

      return res.status(200).send({
        success: true,
        message: "Payment status retrieved successfully",
        data: {
          charge_id: charge.id,
          status: charge.status,
          amount: charge.amount / 100,
          currency: charge.currency,
          customer: charge.customer,
          created_at: charge.created ? new Date(charge.created * 1000).toISOString() : new Date().toISOString(),
          url: charge.url
        }
      });

    } catch (error: any) {
      console.error('Payment Status Error:', error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve payment status",
        error: error.message
      });
    }
  }

  /**
   * Create a refund
   */
  async createRefund(req: FastifyRequest<{ Body: RefundRequest }>, res: FastifyReply) {
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
        reason: reason || 'requested_by_customer',
        description: description || 'Car rental refund',
        metadata: {
          refund_type: 'car_rental_booking',
          created_at: new Date().toISOString()
        }
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
          created_at: refund.created ? new Date(refund.created * 1000).toISOString() : new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Refund Error:', error);
      return res.status(500).send({
        success: false,
        message: "Refund creation failed",
        error: error.message
      });
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(req: FastifyRequest<{ Params: { refund_id: string } }>, res: FastifyReply) {
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
          created_at: refund.created ? new Date(refund.created * 1000).toISOString() : new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error('Refund Status Error:', error);
      return res.status(500).send({
        success: false,
        message: "Failed to retrieve refund status",
        error: error.message
      });
    }
  }
}

export default UserCarRentalPayment;
