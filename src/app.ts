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
import salesPartnerRoutes from "./routes/salesPartner";
import salesPartnerDocRoutes from "./routes/salesPartnerDoc";
import salesPartnerCommissionRoutes from "./routes/salesPartnerCommission";
import salesPartnerUserRoutes from "./routes/salesPartnerUser";
import notificationRoutes from "./routes/notification";
import emailSubscriptionRoutes from "./routes/emailSubscription";
import userAuthRoutes from "./routes/User/userAuth";
import userRoutes from "./routes/User/user";




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

  fastify.register(logsRoutes, { prefix: "admin/logs" });  
  fastify.register(adminRoutes, { prefix: "admin/admins" });
  fastify.register(adminUserRoutes, { prefix: "admin/users" });
  fastify.register(languageRoutes, { prefix: "admin/languages" });
  fastify.register(currencyRoutes, { prefix: "admin/currencies" });
  fastify.register(permissionsRoutes, { prefix: "admin/permissions" });
  
  // Location Routes
  fastify.register(countryRoutes, { prefix: "admin/countries" });
  fastify.register(cityRoutes, { prefix: "admin/cities" });

  // Solution Partner Routes
  fastify.register(solutionPartnerRoutes, { prefix: "admin/solution-partners" });
  fastify.register(solutionPartnerDocRoutes, { prefix: "admin/solution-partner-docs" });
  fastify.register(solutionPartnerUserRoutes, { prefix: "admin/solution-partner-users" });
  fastify.register(solutionPartnerCommissionRoutes, { prefix: "admin/solution-partner-commissions" });

  // Sales Partner Routes
  fastify.register(salesPartnerRoutes, { prefix: "admin/sales-partners" });
  fastify.register(salesPartnerDocRoutes, { prefix: "admin/sales-partner-docs" });
  fastify.register(salesPartnerCommissionRoutes, { prefix: "admin/sales-partner-commissions" });
  fastify.register(salesPartnerUserRoutes, { prefix: "admin/sales-partner-users" });


  // Campaign Routes
  fastify.register(campaignRoutes, { prefix: "admin/campaigns" });

  // Blog Routes
  fastify.register(blogRoutes, { prefix: "admin/blogs" }); 

  // Contract Routes
  fastify.register(contractRoutes, { prefix: "admin/contracts" });

  // User Guide Routes
  fastify.register(userGuideRoutes, { prefix: "admin/user-guides" });

  // FAQ Routes
  fastify.register(faqRoutes, { prefix: "admin/faqs" });

  // Notification Routes
  fastify.register(notificationRoutes, { prefix: "admin/notifications" });

  // Email Subscription Routes
  fastify.register(emailSubscriptionRoutes, { prefix: "admin/email-subscriptions" });

  // User Routes
  fastify.register(userAuthRoutes, { prefix: "/users/auth" });

  fastify.register(userRoutes, { prefix: "/users" });




  
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
