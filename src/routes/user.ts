import { FastifyInstance } from "fastify"

// User Management Routes
import usersRoutes from "./User/user"
import contractsRoutes from "./User/contracts"
import currencyRoutes from "./User/currency"
import languageRoutes from "./User/language"
import countriesRoutes from "./User/countries"

import tourRoutes from "./User/tour"
import dashboardRoutes from "./User/dashboard"
import hotelRoutes from "./User/hotel"
import visaRoutes from "./User/visa"
import carRentalRoutes from "./User/carRental"
import activityRoutes from "./User/activity"
import reservationRoutes from "./User/reservation"
import userGuideRoutes from "./User/userGuide"
import favoritesRoutes from "./User/favorites"
import commentsRoutes from "./User/comments"
import discountRoutes from "./User/discount"
import tourGroupAskRoutes from "./User/tourGroupAsk"
import visaReservationUserFileRoutes from "./User/visaReservationUserFile"

export default async function userMainRoutes(fastify: FastifyInstance) {
	// ===========================================
	// USER MANAGEMENT ROUTES
	// ===========================================
	fastify.register(usersRoutes, { prefix: "/users" })
	fastify.register(contractsRoutes, { prefix: "/contracts" })
	fastify.register(currencyRoutes, { prefix: "/currencies" })
	fastify.register(languageRoutes, { prefix: "/languages" })
	fastify.register(countriesRoutes, { prefix: "/countries" })
	fastify.register(tourRoutes, { prefix: "/tours" })
	fastify.register(visaRoutes, { prefix: "/visas" })
	fastify.register(carRentalRoutes, { prefix: "/car-rentals" })
	fastify.register(dashboardRoutes, { prefix: "/dashboard" })
	fastify.register(hotelRoutes, { prefix: "/hotels" })
	fastify.register(activityRoutes, { prefix: "/activities" })
	fastify.register(reservationRoutes, { prefix: "/reservations" })
	fastify.register(userGuideRoutes, { prefix: "/user-guides" })
	fastify.register(favoritesRoutes, { prefix: "/favorites" })
	fastify.register(commentsRoutes, { prefix: "/comments" })
	fastify.register(discountRoutes, { prefix: "/discount" })
	fastify.register(tourGroupAskRoutes, { prefix: "/tour-group-asks" })
	fastify.register(visaReservationUserFileRoutes, { prefix: "/visa-reservation-user-files" })
}
