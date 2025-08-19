import { FastifyInstance } from "fastify";

// Admin Management Routes
import adminRoutes from "./admin/admin";
import permissionsRoutes from "./admin/permissions";
import logsRoutes from "./admin/logs";
import adminUserRoutes from "./admin/user";

// System Configuration Routes
import languageRoutes from "./admin/language";
import currencyRoutes from "./admin/currency";

// Location Management Routes
import countryRoutes from "./admin/country";
import cityRoutes from "./admin/city";

// Solution Partner Routes
import solutionPartnerRoutes from "./admin/solutionPartner";
import solutionPartnerDocRoutes from "./admin/solutionPartnerDoc";
import solutionPartnerUserRoutes from "./admin/solutionPartnerUser";
import solutionPartnerCommissionRoutes from "./admin/solutionPartnerCommission";

// Sales Partner Routes
import salesPartnerRoutes from "./admin/salesPartner";
import salesPartnerDocRoutes from "./admin/salesPartnerDoc";
import salesPartnerUserRoutes from "./admin/salesPartnerUser";
import salesPartnerCommissionRoutes from "./admin/salesPartnerCommission";

// Content Management Routes
import campaignRoutes from "./admin/campaign";
import blogRoutes from "./admin/blog";
import contractRoutes from "./admin/contract";
import userGuideRoutes from "./admin/userGuide";
import faqRoutes from "./admin/faq";

// Communication Routes
import notificationRoutes from "./admin/notification";
import emailSubscriptionRoutes from "./admin/emailSubscription";

export default async function adminMainRoutes(fastify: FastifyInstance) {
  // ===========================================
  // ADMIN MANAGEMENT ROUTES
  // ===========================================
  fastify.register(adminRoutes, { prefix: "/admins" });
  fastify.register(permissionsRoutes, { prefix: "/permissions" });
  fastify.register(logsRoutes, { prefix: "/logs" });
  fastify.register(adminUserRoutes, { prefix: "/users" });

  // ===========================================
  // SYSTEM CONFIGURATION ROUTES
  // ===========================================
  fastify.register(languageRoutes, { prefix: "/languages" });
  fastify.register(currencyRoutes, { prefix: "/currencies" });

  // ===========================================
  // LOCATION MANAGEMENT ROUTES
  // ===========================================
  fastify.register(countryRoutes, { prefix: "/countries" });
  fastify.register(cityRoutes, { prefix: "/cities" });

  // ===========================================
  // SOLUTION PARTNER ROUTES
  // ===========================================
  fastify.register(solutionPartnerRoutes, { prefix: "/solution-partners" });
  fastify.register(solutionPartnerDocRoutes, { prefix: "/solution-partner-docs" });
  fastify.register(solutionPartnerUserRoutes, { prefix: "/solution-partner-users" });
  fastify.register(solutionPartnerCommissionRoutes, { prefix: "/solution-partner-commissions" });

  // ===========================================
  // SALES PARTNER ROUTES
  // ===========================================
  fastify.register(salesPartnerRoutes, { prefix: "/sales-partners" });
  fastify.register(salesPartnerDocRoutes, { prefix: "/sales-partner-docs" });
  fastify.register(salesPartnerUserRoutes, { prefix: "/sales-partner-users" });
  fastify.register(salesPartnerCommissionRoutes, { prefix: "/sales-partner-commissions" });

  // ===========================================
  // CONTENT MANAGEMENT ROUTES
  // ===========================================
  fastify.register(campaignRoutes, { prefix: "/campaigns" });
  fastify.register(blogRoutes, { prefix: "/blogs" });
  fastify.register(contractRoutes, { prefix: "/contracts" });
  fastify.register(userGuideRoutes, { prefix: "/user-guides" });
  fastify.register(faqRoutes, { prefix: "/faqs" });

  // ===========================================
  // COMMUNICATION ROUTES
  // ===========================================
  fastify.register(notificationRoutes, { prefix: "/notifications" });
  fastify.register(emailSubscriptionRoutes, { prefix: "/email-subscriptions" });
}
