// src/app.ts
import { FastifyInstance } from "fastify";
import path from "path";
import dbPlugin from "./plugins/db";
import adminRoutes from "./routes/Admin/admin";
import authRoutes from "./routes/auth";
import cityRoutes from "./routes/Admin/city";
import districtRoutes from "./routes/Admin/district";
import dealerRoutes from "./routes/Admin/dealer";
import jobRoutes from "./routes/Admin/job";
import dealerUserRoutes from "./routes/Admin/dealerUser";
import insuranceTypeRoutes from "./routes/Admin/insuranceType";
import blogRoutes from "./routes/Admin/blog";
import companyRoutes from "./routes/Admin/company";
import dealerDocumentRoutes from "./routes/Admin/dealerDocument";
import dealerCommissionRoutes from "./routes/Admin/dealerCommission";
import campaignRoutes from "./routes/Admin/campaign";
import frequentlyAskedQuestionRoutes from "./routes/Admin/frequentlyAskedQuestion";
import userRoutes from "./routes/Admin/users";
import communicationPreferenceRoutes from "./routes/Admin/communicationPreference";
import feedbackRoutes from "./routes/Admin/feedback";
import permissionRoutes from "./routes/Admin/permission";
import logRoutes from "./routes/Admin/log";
import notificationRoutes from "./routes/Admin/notification";
import operationRoutes from "./routes/Admin/operation";
import offerRoutes from "./routes/Admin/offer";
import policyRoutes from "./routes/Admin/policy";
import canceledReasonRoutes from "./routes/Admin/canceledReason";
import landingRoutes from "./routes/Admin/landing";
import canceledPolicyRoutes from "./routes/Admin/canceledPolicy";
import userWalletRoutes from "./routes/Admin/userWallet";
import dealerWalletRoutes from "./routes/Admin/dealerWallet";
import agreementRoutes from "./routes/Admin/agreement";
import dealerPolicyRoutes from "./routes/Dealer/policy";
import customerRoutes from "./routes/Dealer/customer";
import communicationCustomerPreferenceRoutes from "./routes/Dealer/communicationPreference";
import customerWalletRoutes from "./routes/Dealer/customerWallet";
import customerFeedbackRoutes from "./routes/Dealer/customerFeedback";
import employeeRoutes from "./routes/Dealer/employee";
import dealerApplicationRoutes from "./routes/Dealer/dealerApplication";
import dealerPermissionRoutes from "./routes/Dealer/permission";
import supportDealerRoutes from "./routes/Dealer/supportDealer";
import supportAdminDealerRoutes from "./routes/Admin/supportAdminDealer";
import userNotificationRoutes from "./routes/Admin/userNotification";
import dealerNotificationRoutes from "./routes/Dealer/dealerNotification";
import customerNotificationRoutes from "./routes/User/customerNotification";
import helpRoutes from "./routes/User/help";
import userCommunicationPreferenceRoutes from "./routes/User/userCommunicationPreference";
import userCustomerRoutes from "./routes/User/userCustomer";
import forceUpdateRoutes from "./routes/User/forceUpdate";






export default async function app(fastify: FastifyInstance) {
  await fastify.register(dbPlugin);
  fastify.register(authRoutes, { prefix: "/auth" });


  // admin routes
  fastify.register(adminRoutes, { prefix: "/admin" });
  fastify.register(userRoutes, { prefix: "/user" });
  fastify.register(cityRoutes, { prefix: "/city" });
  fastify.register(districtRoutes, { prefix: "/district" });
  fastify.register(dealerRoutes, { prefix: "/dealer" });
  fastify.register(jobRoutes, { prefix: "/job" });
  fastify.register(dealerUserRoutes, { prefix: "/dealer-user" });
  fastify.register(insuranceTypeRoutes, { prefix: "/insurance-type" });
  fastify.register(blogRoutes, { prefix: "/blog" });
  fastify.register(dealerDocumentRoutes, { prefix: "/dealer-document" });
  fastify.register(companyRoutes, { prefix: "/company" });
  fastify.register(dealerCommissionRoutes, { prefix: "/dealer-commission" });
  fastify.register(campaignRoutes, { prefix: "/campaign" });
  fastify.register(frequentlyAskedQuestionRoutes, { prefix: "/faq" });
  fastify.register(communicationPreferenceRoutes, {
    prefix: "/communication-preference",
  });
  fastify.register(feedbackRoutes, { prefix: "/feedback" });
  fastify.register(permissionRoutes, { prefix: "/permission" });
  fastify.register(logRoutes, { prefix: "/log" });
  fastify.register(notificationRoutes, { prefix: "/notification" });
  fastify.register(operationRoutes, { prefix: "/operation" });
  fastify.register(offerRoutes, { prefix: "/offer" });
  fastify.register(policyRoutes, { prefix: "/policy" });
  fastify.register(canceledReasonRoutes, { prefix: "/canceled-reason" });
  fastify.register(landingRoutes, { prefix: "/landing" });
  fastify.register(canceledPolicyRoutes, { prefix: "/canceled-policy" });
  fastify.register(userWalletRoutes, { prefix: "/user-wallet" });
  fastify.register(dealerWalletRoutes, { prefix: "/dealer-wallet" });
  fastify.register(agreementRoutes, { prefix: "/agreement" });
  fastify.register(supportAdminDealerRoutes, { prefix: "/support-admin-dealer" });
  fastify.register(userNotificationRoutes, { prefix: "/user-notifications" });
  


  // dealer routes
  fastify.register(dealerPolicyRoutes, { prefix: "/dealer-policy" });
  fastify.register(customerRoutes, { prefix: "/customer" });
  fastify.register(communicationCustomerPreferenceRoutes, { prefix: "/customer-communication-preference" });
  fastify.register(customerWalletRoutes, { prefix: "/customer-wallet" });
  fastify.register(customerFeedbackRoutes, { prefix: "/customer-feedback" });
  fastify.register(employeeRoutes, { prefix: "/employee" });
  fastify.register(dealerApplicationRoutes, { prefix: "/dealer-application" });
  fastify.register(dealerPermissionRoutes, { prefix: "/dealer-permission" });
  fastify.register(supportDealerRoutes, { prefix: "/support-dealer" });
  fastify.register(dealerNotificationRoutes, { prefix: "/dealer-notifications" });





// User routes
fastify.register(customerNotificationRoutes, { prefix: "/customer-notification" });
fastify.register(userCustomerRoutes, { prefix: "/user-customer" });
fastify.register(helpRoutes, { prefix: "/help" });
fastify.register(userCommunicationPreferenceRoutes, {
  prefix: "/user-communication-preference",
});
fastify.register(forceUpdateRoutes, { prefix: "/force-update" });







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
