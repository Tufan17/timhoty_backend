import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const secret = process.env.JWT_SECRET ?? "defaultSecret";
import { v4 as uuid } from "uuid";
import SolutionPartnerUserModel from "@/models/SolutionPartnerUserModel";
import SolutionPartnerModel from "@/models/SolutionPartnerModel";
import HashPassword from "@/utils/hashPassword";
import SolutionPartnerTokenModel from "@/models/SolutionPartnerTokenModel";
import PermissionModel from "@/models/PermissionModel";
import ApplicationStatusModel from "@/models/ApplicationStatusModel";

export default class AuthSolutionPartnerService {
  constructor() {}

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      // Solution Partner User'ı email ile bul
      const solutionPartnerUser = await new SolutionPartnerUserModel().first({
        email,
      });
      if (!solutionPartnerUser) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_FOUND"),
        };
      }

      // Kullanıcının aktif olup olmadığını kontrol et
      if (solutionPartnerUser.status === false) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_ACTIVE"),
        };
      }

      // Solution Partner bilgilerini al
      const solutionPartner = await new SolutionPartnerModel().first({
        id: solutionPartnerUser.solution_partner_id,
      });

      if (!solutionPartner || solutionPartner.status === false) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_COMPANY_NOT_ACTIVE"),
        };
      }

      // Şifre kontrolü
      const isPasswordValid =
        HashPassword(password) === solutionPartnerUser.password;
      if (!isPasswordValid) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.INVALID_PASSWORD"),
        };
      }

      // JWT Token oluştur
      let token;
      try {
        const body = {
          id: solutionPartnerUser.id,
          solution_partner_id: solutionPartnerUser.solution_partner_id,
          name_surname: solutionPartnerUser.name_surname,
          email: solutionPartnerUser.email,
          type: solutionPartnerUser.type,
          language: solutionPartnerUser.language_code,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün
        };

        token = jwt.sign(body, secret, { expiresIn: "1d" }); // 1 gün
      } catch (error) {
        console.error("Error generating token:", error);
        return {
          success: false,
          message: t("SOLUTION_PARTNER.TOKEN_GENERATION_ERROR"),
        };
      }

      // Token'ı veritabanına kaydet (geçici olarak admin_tokens tablosunu kullanıyoruz)
      const week = 7 * 24 * 60 * 60 * 1000; // 1 hafta
      await new SolutionPartnerTokenModel().create({
        id: uuid(),
        solution_partner_user_id: solutionPartnerUser.id, // solution_partner_user_id olarak kullanıyoruz
        token,
        expires_at: new Date(Date.now() + week),
      });

      const permissions =
        await new PermissionModel().getSolutionPartnerPermissions(
          solutionPartnerUser.id
        );

      return {
        success: true,
        message: t("SOLUTION_PARTNER.LOGIN_SUCCESS"),
        user: {
          id: solutionPartnerUser.id,
          solution_partner_id: solutionPartnerUser.solution_partner_id,
          type: solutionPartnerUser.type,
          name_surname: solutionPartnerUser.name_surname,
          email: solutionPartnerUser.email,
          phone: solutionPartnerUser.phone,
          language: solutionPartnerUser.language_code,
          status: solutionPartnerUser.status,
          created_at: solutionPartnerUser.created_at,
          updated_at: solutionPartnerUser.updated_at,
          deleted_at: solutionPartnerUser.deleted_at,
        },
        solutionPartner: {
          id: solutionPartner.id,
          name: solutionPartner.name,
          phone: solutionPartner.phone,
          address: solutionPartner.address,
          tax_office: solutionPartner.tax_office,
          tax_number: solutionPartner.tax_number,
          admin_verified: solutionPartner.admin_verified,
          application_status_id: solutionPartner.application_status_id,
          status: solutionPartner.status,
        },
        permissions,
        token,
      };
    } catch (error) {
      console.error("Solution Partner Login Error:", error);
      return {
        success: false,
        message: t("SOLUTION_PARTNER.LOGIN_ERROR"),
      };
    }
  }

  async logout(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından bul
      const solutionPartnerToken = await new SolutionPartnerTokenModel().first({
        token,
      });
      if (!solutionPartnerToken) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ı sil
      await new SolutionPartnerTokenModel().delete(solutionPartnerToken.id);

      return {
        success: true,
        message: t("SOLUTION_PARTNER.LOGOUT_SUCCESS"),
      };
    } catch (error) {
      console.error("Solution Partner Logout Error:", error);
      return {
        success: false,
        message: t("SOLUTION_PARTNER.LOGOUT_ERROR"),
      };
    }
  }

  async validateToken(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından kontrol et
      const solutionPartnerToken = await new SolutionPartnerTokenModel().first({
        token,
      });
      if (!solutionPartnerToken) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ın süresi dolmuş mu kontrol et
      if (new Date() > new Date(solutionPartnerToken.expires_at)) {
        await new SolutionPartnerTokenModel().delete(solutionPartnerToken.id);
        return {
          success: false,
          message: t("SOLUTION_PARTNER.TOKEN_EXPIRED"),
        };
      }

      // JWT token'ı verify et
      try {
        const decoded = jwt.verify(token, secret) as any;

        // Solution Partner User bilgilerini al
        const solutionPartnerUser = await new SolutionPartnerUserModel().first({
          id: decoded.id,
        });

        if (!solutionPartnerUser || solutionPartnerUser.status === false) {
          return {
            success: false,
            message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_NOT_ACTIVE"),
          };
        }

        return {
          success: true,
          user: solutionPartnerUser,
          decoded,
        };
      } catch (jwtError) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.INVALID_TOKEN"),
        };
      }
    } catch (error) {
      console.error("Token Validation Error:", error);
      return {
        success: false,
        message: t("SOLUTION_PARTNER.TOKEN_VALIDATION_ERROR"),
      };
    }
  }

  async register(
    email: string,
    password: string,
    nameSolutionPartner: string,
    phoneSolutionPartner: string,
    addressSolutionPartner: string,
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
      const solutionPartnerUserCheck = await new SolutionPartnerUserModel().first({
        email,
      });
      if (solutionPartnerUserCheck) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_USER_ALREADY_EXISTS"),
        };
      }

      const exitSolutionPartner = await new SolutionPartnerModel().first({
        name: nameSolutionPartner,
      });
      if (exitSolutionPartner) {
        return {
          success: false,
          message: t("SOLUTION_PARTNER.SOLUTION_PARTNER_ALREADY_EXISTS"),
        };
      } 


      const application_status = await new ApplicationStatusModel().create({
        name: "Pending"
      });

      const solutionPartner = await new SolutionPartnerModel().create({
        name: nameSolutionPartner,
        phone: phoneSolutionPartner,
        address: addressSolutionPartner,
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

      const solutionPartnerUser = await new SolutionPartnerUserModel().create({
        email: email,
        password: password,
        name_surname: nameSurname,
        phone: phoneSolutionPartner,
        solution_partner_id: solutionPartner.id,
        type: "manager",
        language_code: language,
        status: false,
      });

      return {
        success: true,
        message: t("SOLUTION_PARTNER.REGISTER_SUCCESS"),
        data: solutionPartnerUser,
      };
    } catch (error) {
      console.error("Solution Partner Register Error:", error);
      return {
        success: false,
        message: t("SOLUTION_PARTNER.REGISTER_ERROR"),
      };
    }
  }
}
