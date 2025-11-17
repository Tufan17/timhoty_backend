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
import forceUpdateRoutes from "./routes/User/forceUpdate";

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


  // ===========================================
  // FORCE UPDATE ROUTES
  // ===========================================
  fastify.register(forceUpdateRoutes, { prefix: "/force-update" });

  // ===========================================
  // TEST EMAIL ROUTE
  // ===========================================
  fastify.get("/test-email", async (request, reply) => {
    const sendMail = (await import("./utils/mailer")).default;
    const fs = require("fs");
    const emailTemplatePath = path.join(process.cwd(), "emails", "register-tr.html");
    const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8");

    const uploadsUrl = process.env.UPLOADS_URL;
    let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl);

    html = html.replace(/\{\{name\}\}/g, "MEMİŞ ALİ Tufan");

    await sendMail(
      "alitufan.asidev@gmail.com",
      "Test Email",
      html
    );
    return reply.send({ 
      success: true, 
      message: "Test e-postası gönderildi",
      sentTo: "alitufan.asidev@gmail.com"
    });
  });
  
  // ===========================================
  // TEST WHATSAPP ROUTE
  // ===========================================
  fastify.get("/test-whatsapp", async (request, reply) => {
    const { sendWhatsAppTemplate } = await import("./utils/whatsapp");
    // Test modunda sadece template mesajlar çalışır
    // Eğer template'in header'ında image varsa, components parametresi eklenmelidir
    // Örnek kullanım:
    // await sendWhatsAppTemplate("905522855589", "hello", "en", {
    //   header: [
    //     {
    //       type: "image",
    //       image: { link: "https://example.com/image.jpg" }
    //     }
    //   ]
    // });
    
    // Template "hello" header'da image bekliyor, bu yüzden components ile gönderilmeli
    // Not: Gerçek kullanımda image URL'i template'inizin beklediği formatta olmalı
    await sendWhatsAppTemplate("905522855589", "hello", "en", {
      header: [
        {
          type: "image",
          image: { link: "https://via.placeholder.com/500x300" } // Bu URL'i template'inizin beklediği gerçek image URL'i ile değiştirin
        }
      ]
    });
    return reply.send({ success: true, message: "Test WhatsApp template mesajı gönderildi" });
  });

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
