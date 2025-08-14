// src/app.ts
import { FastifyInstance } from "fastify";
import path from "path";
import dbPlugin from "./plugins/db";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import permissionsRoutes from "./routes/permissions";



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
  fastify.register(adminRoutes, { prefix: "/admin" });
  fastify.register(permissionsRoutes, { prefix: "/permissions" });














  
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
