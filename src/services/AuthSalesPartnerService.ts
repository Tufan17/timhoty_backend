import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const secret = process.env.JWT_SECRET ?? "defaultSecret";
import { v4 as uuid } from "uuid";
import SalesPartnerUserModel from "@/models/SalesPartnerUserModel";
import SalesPartnerModel from "@/models/SalesPartnerModel";
import HashPassword from "@/utils/hashPassword";
import SalesPartnerTokenModel from "@/models/SalesPartnerTokenModel";
import PermissionModel from "@/models/PermissionModel";
import ApplicationStatusModel from "@/models/ApplicationStatusModel";

export default class AuthSalesPartnerService {
  constructor() {}

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      // Sales Partner User'ı email ile bul
      const salesPartnerUser = await new SalesPartnerUserModel().first({
        email,
      });
      if (!salesPartnerUser) {
        return {
          success: false,
          message: t("SALES_PARTNER.SALES_PARTNER_NOT_FOUND"),
        };
      }

      // Kullanıcının aktif olup olmadığını kontrol et
      if (salesPartnerUser.status === false) {
        return {
          success: false,
          message: t("SALES_PARTNER.SALES_PARTNER_NOT_ACTIVE"),
        };
      }

      // Sales Partner bilgilerini al
      const salesPartner = await new SalesPartnerModel().first({
        id: salesPartnerUser.sales_partner_id,
      });

      if (!salesPartner || salesPartner.status === false) {
        return {
          success: false,
          message: t("SALES_PARTNER.SALES_PARTNER_COMPANY_NOT_ACTIVE"),
        };
      }

      // Şifre kontrolü
      const isPasswordValid =
        HashPassword(password) === salesPartnerUser.password;
      if (!isPasswordValid) {
        return {
          success: false,
          message: t("SALES_PARTNER.INVALID_PASSWORD"),
        };
      }

      // JWT Token oluştur
      let token;
      try {
        const body = {
          id: salesPartnerUser.id,
          sales_partner_id: salesPartnerUser.sales_partner_id,
          name_surname: salesPartnerUser.name_surname,
          email: salesPartnerUser.email,
          type: salesPartnerUser.type,
          language: salesPartnerUser.language_code,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün
        };

        token = jwt.sign(body, secret, { expiresIn: "1d" }); // 1 gün
      } catch (error) {
        console.error("Error generating token:", error);
        return {
          success: false,
          message: t("SALES_PARTNER.TOKEN_GENERATION_ERROR"),
        };
      }

      // Token'ı veritabanına kaydet
      const week = 7 * 24 * 60 * 60 * 1000; // 1 hafta
      await new SalesPartnerTokenModel().create({
        id: uuid(),
        sales_partner_user_id: salesPartnerUser.id,
        token,
        expires_at: new Date(Date.now() + week),
      });

      const permissions = await new PermissionModel().getSalePartnerPermissions(
        salesPartnerUser.sales_partner_id
      );

      return {
        success: true,
        message: t("SALES_PARTNER.LOGIN_SUCCESS"),
        user: {
          id: salesPartnerUser.id,
          sales_partner_id: salesPartnerUser.sales_partner_id,
          type: salesPartnerUser.type,
          name_surname: salesPartnerUser.name_surname,
          email: salesPartnerUser.email,
          phone: salesPartnerUser.phone,
          language: salesPartnerUser.language_code,
          status: salesPartnerUser.status,
          created_at: salesPartnerUser.created_at,
          updated_at: salesPartnerUser.updated_at,
          deleted_at: salesPartnerUser.deleted_at,
        },
        salesPartner: {
          id: salesPartner.id,
          name: salesPartner.name,
          phone: salesPartner.phone,
          address: salesPartner.address,
          tax_office: salesPartner.tax_office,
          tax_number: salesPartner.tax_number,
          admin_verified: salesPartner.admin_verified,
          application_status_id: salesPartner.application_status_id,
          status: salesPartner.status,
        },
        permissions,
        token,
      };
    } catch (error) {
      console.error("Sales Partner Login Error:", error);
      return {
        success: false,
        message: t("SALES_PARTNER.LOGIN_ERROR"),
      };
    }
  }

  async logout(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından bul
      const salesPartnerToken = await new SalesPartnerTokenModel().first({
        token,
      });
      if (!salesPartnerToken) {
        return {
          success: false,
          message: t("SALES_PARTNER.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ı sil
      await new SalesPartnerTokenModel().delete(salesPartnerToken.id);

      return {
        success: true,
        message: t("SALES_PARTNER.LOGOUT_SUCCESS"),
      };
    } catch (error) {
      console.error("Sales Partner Logout Error:", error);
      return {
        success: false,
        message: t("SALES_PARTNER.LOGOUT_ERROR"),
      };
    }
  }

  async validateToken(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından kontrol et
      const salesPartnerToken = await new SalesPartnerTokenModel().first({
        token,
      });
      if (!salesPartnerToken) {
        return {
          success: false,
          message: t("SALES_PARTNER.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ın süresi dolmuş mu kontrol et
      if (new Date() > new Date(salesPartnerToken.expires_at)) {
        await new SalesPartnerTokenModel().delete(salesPartnerToken.id);
        return {
          success: false,
          message: t("SALES_PARTNER.TOKEN_EXPIRED"),
        };
      }

      // JWT token'ı verify et
      try {
        const decoded = jwt.verify(token, secret) as any;

        // Sales Partner User bilgilerini al
        const salesPartnerUser = await new SalesPartnerUserModel().first({
          id: decoded.id,
        });

        if (!salesPartnerUser || salesPartnerUser.status === false) {
          return {
            success: false,
            message: t("SALES_PARTNER.SALES_PARTNER_NOT_ACTIVE"),
          };
        }

        return {
          success: true,
          user: salesPartnerUser,
          decoded,
        };
      } catch (jwtError) {
        return {
          success: false,
          message: t("SALES_PARTNER.INVALID_TOKEN"),
        };
      }
    } catch (error) {
      console.error("Token Validation Error:", error);
      return {
        success: false,
        message: t("SALES_PARTNER.TOKEN_VALIDATION_ERROR"),
      };
    }
  }

  async register(
    email: string,
    password: string,
    nameSalesPartner: string,
    phoneSalesPartner: string,
    addressSalesPartner: string,
    taxOffice: string,
    taxNumber: string,
    bankName: string,
    swiftNumber: string,
    accountOwner: string,
    iban: string,
    nameSurname: string,
    country: string,
    city: string,
    language: string,
    t: (key: string) => string
  ) {
    try {
      const salesPartnerUserCheck = await new SalesPartnerUserModel().first({
        email,
      });
      if (salesPartnerUserCheck) {
        return {
          success: false,
          message: t("SALES_PARTNER.SALES_PARTNER_USER_ALREADY_EXISTS"),
        };
      }

      const exitSalesPartner = await new SalesPartnerModel().first({
        name: nameSalesPartner,
      });
      if (exitSalesPartner) {
        return {
          success: false,
          message: t("SALES_PARTNER.SALES_PARTNER_ALREADY_EXISTS"),
        };
      }

      const application_status = await new ApplicationStatusModel().create({
        name: "Pending",
      });

      const salesPartner = await new SalesPartnerModel().create({
        name: nameSalesPartner,
        phone: phoneSalesPartner,
        address: addressSalesPartner,
        tax_office: taxOffice,
        tax_number: taxNumber,
        bank_name: bankName,
        swift_number: swiftNumber,
        account_owner: accountOwner,
        iban: iban,
        location_id: city,
        application_status_id: application_status?.id,
        language_code: language,
      });

      const salesPartnerUser = await new SalesPartnerUserModel().create({
        email: email,
        password: password,
        name_surname: nameSurname,
        phone: phoneSalesPartner,
        sales_partner_id: salesPartner.id,
        type: "manager",
        language_code: language,
        status: false,
      });
      sendMailApplicationReceived(email, nameSurname, t);
      return {
        success: true,
        message: t("SALES_PARTNER.REGISTER_SUCCESS"),
        data: salesPartnerUser,
      };
    } catch (error) {
      console.error("Sales Partner Register Error:", error);
      return {
        success: false,
        message: t("SALES_PARTNER.REGISTER_ERROR"),
      };
    }
  }
}

async function sendMailApplicationReceived(
  email: string,
  nameSurname: string,
  t: (key: string) => string
) {
  try {
    const sendMail = (await import("@/utils/mailer")).default;
    const path = require("path");
    const fs = require("fs");
    const emailTemplatePath = path.join(
      process.cwd(),
      "emails",
      "application_received.html"
    );
    const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8");
    const uploadsUrl = process.env.UPLOADS_URL;
    let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl);
    html = html.replace(/\{\{name\}\}/g, nameSurname);
    await sendMail(email, "Timhoty - Acente Başvurunuz Alındı", html);
  } catch (error) {
    console.error("Application received email error:", error);
  }
}
