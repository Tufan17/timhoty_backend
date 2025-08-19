import { FastifyInstance } from "fastify";

// User Management Routes
import usersRoutes from "./User/user";

export default async function userMainRoutes(fastify: FastifyInstance) {
  // ===========================================
  // USER MANAGEMENT ROUTES
  // ===========================================
  fastify.register(usersRoutes, { prefix: "/users" });
}
