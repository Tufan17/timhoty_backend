import { FastifyInstance } from "fastify"

// Admin Management Routes
import adminRoutes from "./Admin/admin"
import permissionsRoutes from "./Admin/permissions"
import logsRoutes from "./Admin/logs"
import adminUserRoutes from "./Admin/user"

// System Configuration Routes
import languageRoutes from "./Admin/language"
import currencyRoutes from "./Admin/currency"

// Location Management Routes
import countryRoutes from "./Admin/country"
import cityRoutes from "./Admin/city"

// Solution Partner Routes
import solutionPartnerRoutes from "./Admin/solutionPartner"
import solutionPartnerDocRoutes from "./Admin/solutionPartnerDoc"
import solutionPartnerUserRoutes from "./Admin/solutionPartnerUser"
import solutionPartnerCommissionRoutes from "./Admin/solutionPartnerCommission"

// Sales Partner Routes
import salesPartnerRoutes from "./Admin/salesPartner"
import salesPartnerDocRoutes from "./Admin/salesPartnerDoc"
import salesPartnerUserRoutes from "./Admin/salesPartnerUser"
import salesPartnerCommissionRoutes from "./Admin/salesPartnerCommission"

// Content Management Routes
import campaignRoutes from "./Admin/campaign"
import blogRoutes from "./Admin/blog"
import contractRoutes from "./Admin/contract"
import userGuideRoutes from "./Admin/userGuide"
import faqRoutes from "./Admin/faq"

// Communication Routes
import notificationRoutes from "./Admin/notification"
import emailSubscriptionRoutes from "./Admin/emailSubscription"

export default async function adminMainRoutes(fastify: FastifyInstance) {
	// ===========================================
	// ADMIN MANAGEMENT ROUTES
	// ===========================================
	fastify.register(adminRoutes, { prefix: "/admins" })
	fastify.register(permissionsRoutes, { prefix: "/permissions" })
	fastify.register(logsRoutes, { prefix: "/logs" })
	fastify.register(adminUserRoutes, { prefix: "/users" }) // customers

	// ===========================================
	// SYSTEM CONFIGURATION ROUTES
	// ===========================================
	fastify.register(languageRoutes, { prefix: "/languages" })
	fastify.register(currencyRoutes, { prefix: "/currencies" })

	// ===========================================
	// LOCATION MANAGEMENT ROUTES
	// ===========================================
	fastify.register(countryRoutes, { prefix: "/countries" })
	fastify.register(cityRoutes, { prefix: "/cities" })

	// ===========================================
	// SOLUTION PARTNER ROUTES
	// ===========================================
	fastify.register(solutionPartnerRoutes, { prefix: "/solution-partners" })
	fastify.register(solutionPartnerDocRoutes, { prefix: "/solution-partner-docs" })
	fastify.register(solutionPartnerUserRoutes, { prefix: "/solution-partner-users" })
	fastify.register(solutionPartnerCommissionRoutes, { prefix: "/solution-partner-commissions" })

	// ===========================================
	// SALES PARTNER ROUTES
	// ===========================================
	fastify.register(salesPartnerRoutes, { prefix: "/sales-partners" })
	fastify.register(salesPartnerDocRoutes, { prefix: "/sales-partner-docs" })
	fastify.register(salesPartnerUserRoutes, { prefix: "/sales-partner-users" })
	fastify.register(salesPartnerCommissionRoutes, { prefix: "/sales-partner-commissions" })

	// ===========================================
	// CONTENT MANAGEMENT ROUTES
	// ===========================================
	fastify.register(campaignRoutes, { prefix: "/campaigns" })
	fastify.register(blogRoutes, { prefix: "/blogs" })
	fastify.register(contractRoutes, { prefix: "/contracts" })
	fastify.register(userGuideRoutes, { prefix: "/user-guides" })
	fastify.register(faqRoutes, { prefix: "/faqs" })

	// ===========================================
	// COMMUNICATION ROUTES
	// ===========================================
	fastify.register(notificationRoutes, { prefix: "/notifications" })
	fastify.register(emailSubscriptionRoutes, { prefix: "/email-subscriptions" })
}
