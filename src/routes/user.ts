import { FastifyInstance } from "fastify";

// User Management Routes
import usersRoutes from "./User/user";
import contractsRoutes from "./User/contracts";
import tourRoutes from "./User/tour";
import dashboardRoutes from "./User/dashboard";
import hotelRoutes from "./User/hotel";
import visaRoutes from "./User/visa";
import carRentalRoutes from "./User/carRental";

export default async function userMainRoutes(fastify: FastifyInstance) {
  // ===========================================
  // USER MANAGEMENT ROUTES
  // ===========================================
  fastify.register(usersRoutes, { prefix: "/users" });
  fastify.register(contractsRoutes, { prefix: "/contracts" });
  fastify.register(tourRoutes, { prefix: "/tours" });
  fastify.register(visaRoutes, { prefix: "/visas" });
  fastify.register(carRentalRoutes, { prefix: "/car-rentals" });
  fastify.register(dashboardRoutes, { prefix: "/dashboard" });
  fastify.register(hotelRoutes, { prefix: "/hotels" });
}
