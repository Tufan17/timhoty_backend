import { FastifyInstance } from "fastify";
import HotelPayment from "@/controllers/Payment/SalePartner/HotelPayment";
import { authSalesPartnerMiddleware } from "@/middlewares/authSalesPartnerMiddleware";
import WebhookController from "@/controllers/Payment/WebhookController";
import TourPayment from "@/controllers/Payment/SalePartner/TourPayment";
import ActivityPayment from "@/controllers/Payment/SalePartner/ActivityPayment";
import VisaPayment from "@/controllers/Payment/SalePartner/VisaPayment";  
export default async function paymentRoutes(fastify: FastifyInstance) {
  const hotelPayment = new HotelPayment();
  const webhookController = new WebhookController();
  const tourPayment = new TourPayment();
  const activityPayment = new ActivityPayment();
  const visaPayment = new VisaPayment();
  // Hotel Payment Routes
  fastify.post("/hotel", {
    preHandler: [authSalesPartnerMiddleware],
    handler: hotelPayment.createPaymentIntent,
  });

  fastify.get("/hotel/status/:charge_id", {
    handler: hotelPayment.getPaymentStatus,
  });

  fastify.post("/hotel/refund", {
    handler: hotelPayment.createRefund,
  });

  fastify.get("/hotel/refund/:refund_id", {
    handler: hotelPayment.getRefundStatus,
  });

  fastify.get("/hotel/charges", {
    handler: hotelPayment.listCharges,
  });

  // Tour Payment Routes
  fastify.post("/tour", {
    preHandler: [authSalesPartnerMiddleware],
    handler: tourPayment.createPaymentIntent,
  });
  fastify.get("/tour/status/:charge_id", {
    handler: tourPayment.getPaymentStatus,
  });
  fastify.post("/tour/refund", {
    handler: tourPayment.createRefund,
  });
  fastify.get("/tour/refund/:refund_id", {
    handler: tourPayment.getRefundStatus,
  });


  // Activity Payment Routes
  fastify.post("/activity", {
    preHandler: [authSalesPartnerMiddleware],
    handler: activityPayment.createPaymentIntent,
  });

  fastify.get("/activity/status/:charge_id", {
    handler: activityPayment.getPaymentStatus,
  });

  fastify.post("/activity/refund", {
    handler: activityPayment.createRefund,
  });

  fastify.get("/activity/refund/:refund_id", {
    handler: activityPayment.getRefundStatus,
  });


  // Visa Payment Routes
  fastify.post("/visa", {
    preHandler: [authSalesPartnerMiddleware],
    handler: visaPayment.createPaymentIntent,
  });
  fastify.get("/visa/status/:charge_id", {
    handler: visaPayment.getPaymentStatus,
  });
  fastify.post("/visa/refund", {
    handler: visaPayment.createRefund,
  });
  fastify.get("/visa/refund/:refund_id", {
    handler: visaPayment.getRefundStatus,
  });
  fastify.get("/visa/charges", {
    handler: visaPayment.listCharges,
  });


  // Webhook Routes
  fastify.post("/activity/webhook", {
    handler: webhookController.handleWebhook,
  });
}
