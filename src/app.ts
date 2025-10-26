// src/app.ts
import { FastifyInstance } from "fastify";
import path from "path";

// Plugins and Middleware
import dbPlugin from "./plugins/db";
import { languageMiddleware } from "./middlewares/languageMiddleware";

// Authentication Routes
import authRoutes from "./routes/auth";
import solutionPartnerMainRoutes from "./routes/solutionPartner";
import salesPartnerMainRoutes from "./routes/salesPartner";

// Admin Management Routes (All admin routes grouped together)
import adminMainRoutes from "./routes/admin";

// User Routes
import userMainRoutes from "./routes/user";

// Payment Routes
import paymentRoutes from "./routes/payment";

export default async function app(fastify: FastifyInstance) {
  await fastify.register(dbPlugin);

  // Global language middleware
  fastify.addHook("preHandler", languageMiddleware);

  fastify.register((fastify) => {
    fastify.get("/", (request, reply) => {
      return reply.send({ message: "Timhoty Test Api'ye Hoşgeldiniz :)" });
    });
  });

  // ===========================================
  // AUTHENTICATION ROUTES
  // ===========================================
  fastify.register(authRoutes, { prefix: "/auth" });

  // ===========================================
  // ADMIN ROUTES (All admin functionality)
  // ===========================================
  fastify.register(adminMainRoutes, { prefix: "/admin" });

  // ===========================================
  // USER ROUTES (All user functionality)
  // ===========================================
  fastify.register(userMainRoutes, { prefix: "/user" });

  // ===========================================
  // SOLUTION PARTNER ROUTES (All solution partner functionality)
  // ===========================================
  fastify.register(solutionPartnerMainRoutes, { prefix: "/solution-partner" });

  // ===========================================
  // SALES PARTNER ROUTES (All sales partner functionality)
  // ===========================================
  fastify.register(salesPartnerMainRoutes, { prefix: "/sales-partner" });

  // ===========================================
  // PAYMENT ROUTES
  // ===========================================
  fastify.register(paymentRoutes, { prefix: "/payment" });

  fastify.get(
    "/uploads/:folder/:filename",
    async function handler(request, reply) {
      try {
        const { folder, filename } = request.params as {
          folder: string;
          filename: string;
        };
        console.log(folder, filename);
        return reply.sendFile(path.join(folder, filename));
      } catch (err) {
        return reply.status(500).send({ error: "Dosya bulunamadı" });
      }
    }
  );
}
