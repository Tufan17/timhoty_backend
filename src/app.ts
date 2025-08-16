// src/app.ts
import { FastifyInstance } from "fastify";
import path from "path";
import dbPlugin from "./plugins/db";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import permissionsRoutes from "./routes/permissions";
import logsRoutes from "./routes/logs";
import currencyRoutes from "./routes/currency";
import languageRoutes from "./routes/language";
import adminUserRoutes from "./routes/user";
import countryRoutes from "./routes/country";
import cityRoutes from "./routes/city";
import solutionPartnerRoutes from "./routes/solutionPartner";




export default async function app(fastify: FastifyInstance) {
  await fastify.register(dbPlugin);


  fastify.register(
      (fastify) => {
        fastify.get('/', (request, reply) => {
          return reply.send({ message: "Timhoty'e Hoşgeldiniz :)" });
        });
    }
  );

  

  fastify.register(authRoutes, { prefix: "/auth" });

  
  fastify.register(adminRoutes, { prefix: "/admins" });
  fastify.register(permissionsRoutes, { prefix: "/permissions" });
  fastify.register(logsRoutes, { prefix: "/logs" });
  fastify.register(languageRoutes, { prefix: "/languages" });
  fastify.register(currencyRoutes, { prefix: "/currencies" });
  fastify.register(adminUserRoutes, { prefix: "/users" });
  fastify.register(countryRoutes, { prefix: "/countries" });
  fastify.register(cityRoutes, { prefix: "/cities" });
  fastify.register(solutionPartnerRoutes, { prefix: "/solution-partners" });













  
  fastify.get(
    "/uploads/:folder/:filename",
    async function handler(request, reply) {
      try {
        const { folder, filename } = request.params as {
          folder: string;
          filename: string;
        };
        return reply.sendFile(path.join(folder, filename));
      } catch (err) {
        return reply.status(500).send({ error: "Dosya bulunamadı" });
      }
    }
  );
}
