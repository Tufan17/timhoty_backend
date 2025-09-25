import { FastifyInstance } from "fastify";
import UserHotelPayment from "@/controllers/Payment/User/HotelPayment";
import UserTourPayment from "@/controllers/Payment/User/TourPayment";
import UserCarRentalPayment from "@/controllers/Payment/User/CarRentalPayment";
import UserVisaPayment from "@/controllers/Payment/User/VisaPayment";
import WebhookController from "@/controllers/Payment/WebhookController";

export default async function paymentRoutes(fastify: FastifyInstance) {
  const hotelPayment = new UserHotelPayment();
  const tourPayment = new UserTourPayment();
  const carRentalPayment = new UserCarRentalPayment();
  const visaPayment = new UserVisaPayment();
  const webhookController = new WebhookController();

  // Hotel Payment Routes
  fastify.post("/user/hotel", {
    handler: hotelPayment.createPaymentIntent,
  });

  fastify.get("/user/hotel/status/:charge_id", {
    handler: hotelPayment.getPaymentStatus,
  });

  fastify.post("/user/hotel/refund", {
    handler: hotelPayment.createRefund,
  });

  fastify.get("/user/hotel/refund/:refund_id", {
    handler: hotelPayment.getRefundStatus,
  });

  fastify.get("/user/hotel/charges", {
    handler: hotelPayment.listCharges,
  });

  // Tour Payment Routes
  fastify.post("/user/tour", {
    handler: tourPayment.createPaymentIntent,
  });

  fastify.get("/user/tour/status/:charge_id", {
    handler: tourPayment.getPaymentStatus,
  });

  fastify.post("/user/tour/refund", {
    handler: tourPayment.createRefund,
  });

  fastify.get("/user/tour/refund/:refund_id", {
    handler: tourPayment.getRefundStatus,
  });

  // Car Rental Payment Routes
  fastify.post("/user/car-rental", {
    handler: carRentalPayment.createPaymentIntent,
  });

  fastify.get("/user/car-rental/status/:charge_id", {
    handler: carRentalPayment.getPaymentStatus,
  });

  fastify.post("/user/car-rental/refund", {
    handler: carRentalPayment.createRefund,
  });

  fastify.get("/user/car-rental/refund/:refund_id", {
    handler: carRentalPayment.getRefundStatus,
  });

  // Visa Payment Routes
  fastify.post("/user/visa", {
    handler: visaPayment.createPaymentIntent,
  });

  fastify.get("/user/visa/status/:charge_id", {
    handler: visaPayment.getPaymentStatus,
  });

  fastify.post("/user/visa/refund", {
    handler: visaPayment.createRefund,
  });

  fastify.get("/user/visa/refund/:refund_id", {
    handler: visaPayment.getRefundStatus,
  });

  // Webhook Routes
  fastify.post("/webhook", {
    handler: webhookController.handleWebhook,
  });
}
