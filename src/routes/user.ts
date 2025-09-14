import { FastifyInstance } from "fastify";

// User Management Routes
import usersRoutes from "./User/user";
import contractsRoutes from "./User/contracts";
import currencyRoutes from "./User/currency";
import languageRoutes from "./User/language";
import countriesRoutes from "./User/countries";

export default async function userMainRoutes(fastify: FastifyInstance) {
  // ===========================================
  // USER MANAGEMENT ROUTES
  // ===========================================
  fastify.register(usersRoutes, { prefix: "/users" });
  fastify.register(contractsRoutes, { prefix: "/contracts" });
  fastify.register(currencyRoutes, { prefix: "/currencies" });
  fastify.register(languageRoutes, { prefix: "/languages" });
  fastify.register(countriesRoutes, { prefix: "/countries" });
}
