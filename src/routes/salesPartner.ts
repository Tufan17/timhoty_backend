import { FastifyInstance } from "fastify"
import hotelRoutes from "./SalesPartner/hotel"

export default async function salesPartnerRoutes(fastify: FastifyInstance) {
	// ===========================================
	// HOTEL ROUTES
	// ===========================================
	fastify.register(hotelRoutes, { prefix: "/hotels" })
}
