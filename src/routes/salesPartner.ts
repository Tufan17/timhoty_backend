import { FastifyInstance } from "fastify"
import hotelRoutes from "./SalesPartner/hotel"
import hotelReservationRoutes from "./SalesPartner/hotelReservation"
import countryRoutes from "./SalesPartner/country"
import cityRoutes from "./SalesPartner/city"
import paymentRoutes from "./SalesPartner/payment"
import tourRoutes from "./SalesPartner/tour"
import tourReservationRoutes from "./SalesPartner/tourReservation"

export default async function salesPartnerRoutes(fastify: FastifyInstance) {
	// ===========================================
	// COUNTRY ROUTES
	// ===========================================
	fastify.register(countryRoutes, { prefix: "/countries" })
	
	// ===========================================
	// CITY ROUTES
	// ===========================================
	fastify.register(cityRoutes, { prefix: "/cities" })
	
	// ===========================================
	// HOTEL ROUTES
	// ===========================================
	fastify.register(hotelRoutes, { prefix: "/hotels" })
	
	// ===========================================
	// HOTEL RESERVATION ROUTES
	// ===========================================
	fastify.register(hotelReservationRoutes, { prefix: "/hotel-reservations" })


	// ===========================================
	// TOUR ROUTES
	// ===========================================
	fastify.register(tourRoutes, { prefix: "/tours" })

	// ===========================================
	// TOUR RESERVATION ROUTES
	// ===========================================
	fastify.register(tourReservationRoutes, { prefix: "/tour-reservations" })






    // ===========================================
    // PAYMENT ROUTES
    // ===========================================
    fastify.register(paymentRoutes, { prefix: "/payment" })
}
