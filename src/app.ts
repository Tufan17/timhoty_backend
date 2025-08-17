// src/app.ts
import { FastifyInstance } from "fastify";
import path from "path";
import dbPlugin from "./plugins/db";
import { languageMiddleware } from "./middlewares/languageMiddleware";
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
import solutionPartnerDocRoutes from "./routes/solutionPartnerDoc";
import solutionPartnerUserRoutes from "./routes/solutionPartnerUser";
import solutionPartnerCommissionRoutes from "./routes/solutionPartnerCommission";
import campaignRoutes from "./routes/campaign";
import blogRoutes from "./routes/blog";
import contractRoutes from "./routes/contract";
import userGuideRoutes from "./routes/userGuide";
import faqRoutes from "./routes/faq";




export default async function app(fastify: FastifyInstance) {
  await fastify.register(dbPlugin);

  // Global language middleware
  fastify.addHook('preHandler', languageMiddleware);


  fastify.register(
      (fastify) => {
        fastify.get('/', (request, reply) => {
          return reply.send({ message: "Timhoty'e Hoşgeldiniz :)" });
        });
    }
  );

  

  fastify.register(authRoutes, { prefix: "/auth" });

  fastify.register(logsRoutes, { prefix: "/logs" });  
  fastify.register(adminRoutes, { prefix: "/admins" });
  fastify.register(adminUserRoutes, { prefix: "/users" });
  fastify.register(languageRoutes, { prefix: "/languages" });
  fastify.register(currencyRoutes, { prefix: "/currencies" });
  fastify.register(permissionsRoutes, { prefix: "/permissions" });
  
  // Location Routes
  fastify.register(countryRoutes, { prefix: "/countries" });
  fastify.register(cityRoutes, { prefix: "/cities" });

  // Solution Partner Routes
  fastify.register(solutionPartnerRoutes, { prefix: "/solution-partners" });
  fastify.register(solutionPartnerDocRoutes, { prefix: "/solution-partner-docs" });
  fastify.register(solutionPartnerUserRoutes, { prefix: "/solution-partner-users" });
  fastify.register(solutionPartnerCommissionRoutes, { prefix: "/solution-partner-commissions" });


  // Campaign Routes
  fastify.register(campaignRoutes, { prefix: "/campaigns" });

  // Blog Routes
  fastify.register(blogRoutes, { prefix: "/blogs" }); 

  // Contract Routes
  fastify.register(contractRoutes, { prefix: "/contracts" });

  // User Guide Routes
  fastify.register(userGuideRoutes, { prefix: "/user-guides" });

  // FAQ Routes
  fastify.register(faqRoutes, { prefix: "/faqs" });







  
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
