import { FastifyInstance } from "fastify";
import hotelRoutes from "./SalesPartner/hotel";
import hotelReservationRoutes from "./SalesPartner/hotelReservation";
import countryRoutes from "./SalesPartner/country";
import cityRoutes from "./SalesPartner/city";
import paymentRoutes from "./SalesPartner/payment";
import tourRoutes from "./SalesPartner/tour";
import tourReservationRoutes from "./SalesPartner/tourReservation";
import activityRoutes from "./SalesPartner/activity";
import activityReservationRoutes from "./SalesPartner/activityReservation";
import visaReservationRoutes from "./SalesPartner/visaReservation";
import visaRoutes from "./SalesPartner/visa";
import visaReservationUserFileRoutes from "./SalesPartner/visaReservationUserFile";
import carRentalRoutes from "./SalesPartner/carRental";
import carRentalReservationRoutes from "./SalesPartner/carRentalReservation";
import workerRoutes from "./SalesPartner/worker";
export default async function salesPartnerRoutes(fastify: FastifyInstance) {
  // ===========================================
  // COUNTRY ROUTES
  // ===========================================
  fastify.register(countryRoutes, { prefix: "/countries" });

  // ===========================================
  // CITY ROUTES
  // ===========================================
  fastify.register(cityRoutes, { prefix: "/cities" });

  // ===========================================
  // HOTEL ROUTES
  // ===========================================
  fastify.register(hotelRoutes, { prefix: "/hotels" });

  // ===========================================
  // HOTEL RESERVATION ROUTES
  // ===========================================
  fastify.register(hotelReservationRoutes, { prefix: "/hotel-reservations" });

  // ===========================================
  // TOUR ROUTES
  // ===========================================
  fastify.register(tourRoutes, { prefix: "/tours" });

  // ===========================================
  // TOUR RESERVATION ROUTES
  // ===========================================
  fastify.register(tourReservationRoutes, { prefix: "/tour-reservations" });

  // ===========================================
  // ACTIVITY ROUTES
  // ===========================================
  fastify.register(activityRoutes, { prefix: "/activities" });

  // ===========================================
  // ACTIVITY RESERVATION ROUTES
  // ===========================================
  fastify.register(activityReservationRoutes, {
    prefix: "/activity-reservations",
  });

  // ===========================================
  // VISA ROUTES
  // ===========================================
  fastify.register(visaRoutes, { prefix: "/visas" });
  // ===========================================
  // VISA RESERVATION ROUTES
  // ===========================================
  fastify.register(visaReservationRoutes, { prefix: "/visa-reservations" });

  // ===========================================
  // VISA RESERVATION USER FILE ROUTES
  // ===========================================
  fastify.register(visaReservationUserFileRoutes, { prefix: "/visa-reservation-user-files" });

  // ===========================================
  // CAR RENTAL ROUTES
  // ===========================================
  fastify.register(carRentalRoutes, { prefix: "/car-rentals" });

  // ===========================================
  // CAR RENTAL RESERVATION ROUTES
  // ===========================================
  fastify.register(carRentalReservationRoutes, { prefix: "/car-rental-reservations" });

  // ===========================================
  // PAYMENT ROUTES
  // ===========================================
  fastify.register(paymentRoutes, { prefix: "/payment" });


  // ===========================================
  // WORKER ROUTES
  // ===========================================
	fastify.register(workerRoutes, { prefix: "/workers" })

}
