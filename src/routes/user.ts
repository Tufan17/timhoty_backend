import { FastifyInstance } from "fastify";

// User Management Routes
import usersRoutes from "./User/user";
import contractsRoutes from "./User/contracts";
import tourRoutes from "./User/tour";

export default async function userMainRoutes(fastify: FastifyInstance) {
  // ===========================================
  // USER MANAGEMENT ROUTES
  // ===========================================
  fastify.register(usersRoutes, { prefix: "/users" });
  fastify.register(contractsRoutes, { prefix: "/contracts" });
  fastify.register(tourRoutes, { prefix: "/tours" });
}
