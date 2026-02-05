import { FastifyInstance } from "fastify"
import ViatorController from "../../controllers/v2/ViatorController"

export default async function viatorRoutes(fastify: FastifyInstance) {
	// Products
	fastify.post("/products/search", ViatorController.searchProducts.bind(ViatorController))
	fastify.post("/products/search-with-details", ViatorController.searchProductsWithDetails.bind(ViatorController))
	fastify.get("/products/modified", ViatorController.getModifiedProducts.bind(ViatorController))
	fastify.get("/products/:productCode", ViatorController.getProduct.bind(ViatorController))
	fastify.post("/products/bulk", ViatorController.getProducts.bind(ViatorController))

	// Sync (Test)
	fastify.get("/sync/products/test", ViatorController.syncProductsTest.bind(ViatorController))
	fastify.get("/sync/products", ViatorController.syncProducts.bind(ViatorController))

	// Availability
	fastify.post("/availability/check", ViatorController.checkAvailability.bind(ViatorController))
	fastify.get("/availability/schedule/:productCode", ViatorController.getAvailabilitySchedule.bind(ViatorController))

	// Destinations
	fastify.get("/destinations", ViatorController.getDestinations.bind(ViatorController))
	fastify.get("/destinations/countries", ViatorController.getCountries.bind(ViatorController))
	fastify.get("/destinations/countries/sync", ViatorController.getCountriesSync.bind(ViatorController))
	fastify.get("/destinations/cities/sync", ViatorController.getCitiesSync.bind(ViatorController))
	fastify.get("/destinations/:ref", ViatorController.getDestinationByRef.bind(ViatorController))

	// Tags
	fastify.get("/tags", ViatorController.getTags.bind(ViatorController))
	fastify.get("/tags/sync", ViatorController.getTagsSync.bind(ViatorController))

	// Reviews
	fastify.post("/reviews/:productCode", ViatorController.getProductReviews.bind(ViatorController))

	// Bookings
	fastify.post("/bookings/hold", ViatorController.holdBooking.bind(ViatorController))
	fastify.post("/bookings/confirm", ViatorController.confirmBooking.bind(ViatorController))
	fastify.get("/bookings/:bookingReference/status", ViatorController.getBookingStatus.bind(ViatorController))
	fastify.post("/bookings/:bookingReference/cancel", ViatorController.cancelBooking.bind(ViatorController))
}
