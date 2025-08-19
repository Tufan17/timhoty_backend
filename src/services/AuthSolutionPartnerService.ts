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

export default class AuthSolutionPartnerService {
  constructor() {}

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      // Solution Partner User'ı email ile bul
      const solutionPartnerUser = await new SolutionPartnerUserModel().first({ email });
      if (!solutionPartnerUser) {
        return {
          success: false,
          message: t("AUTH.SOLUTION_PARTNER_NOT_FOUND"),
        };
      }

      // Kullanıcının aktif olup olmadığını kontrol et
      if (solutionPartnerUser.status === false) {
        return {
          success: false,
          message: t("AUTH.SOLUTION_PARTNER_NOT_ACTIVE"),
        };
      }

      // Solution Partner bilgilerini al
      const solutionPartner = await new SolutionPartnerModel().first({ 
        id: solutionPartnerUser.solution_partner_id 
      });

      if (!solutionPartner || solutionPartner.status === false) {
        return {
          success: false,
          message: t("AUTH.SOLUTION_PARTNER_COMPANY_NOT_ACTIVE"),
        };
      }

      // Şifre kontrolü
      const isPasswordValid = HashPassword(password) === solutionPartnerUser.password;
      if (!isPasswordValid) {
        return {
          success: false,
          message: t("AUTH.INVALID_PASSWORD"),
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
          message: t("AUTH.TOKEN_GENERATION_ERROR"),
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

      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
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
        token,
      };
    } catch (error) {
      console.error("Solution Partner Login Error:", error);
      return {
        success: false,
        message: t("AUTH.LOGIN_ERROR"),
      };
    }
  }

  async logout(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından bul
      const solutionPartnerToken = await new SolutionPartnerTokenModel().first({ token });
      if (!solutionPartnerToken) {
        return {
          success: false,
          message: t("AUTH.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ı sil
      await new SolutionPartnerTokenModel().delete(solutionPartnerToken.id);
      
      return {
        success: true,
        message: t("AUTH.LOGOUT_SUCCESS"),
      };
    } catch (error) {
      console.error("Solution Partner Logout Error:", error);
      return {
        success: false,
        message: t("AUTH.LOGOUT_ERROR"),
      };
    }
  }

  async validateToken(token: string, t: (key: string) => string) {
    try {
      // Token'ı veritabanından kontrol et
      const solutionPartnerToken = await new SolutionPartnerTokenModel().first({ token });
      if (!solutionPartnerToken) {
        return {
          success: false,
          message: t("AUTH.TOKEN_NOT_FOUND"),
        };
      }

      // Token'ın süresi dolmuş mu kontrol et
      if (new Date() > new Date(solutionPartnerToken.expires_at)) {
        await new SolutionPartnerTokenModel().delete(solutionPartnerToken.id);
        return {
          success: false,
          message: t("AUTH.TOKEN_EXPIRED"),
        };
      }

      // JWT token'ı verify et
      try {
        const decoded = jwt.verify(token, secret) as any;
        
        // Solution Partner User bilgilerini al
        const solutionPartnerUser = await new SolutionPartnerUserModel().first({ 
          id: decoded.id 
        });
        
        if (!solutionPartnerUser || solutionPartnerUser.status === false) {
          return {
            success: false,
            message: t("AUTH.SOLUTION_PARTNER_NOT_ACTIVE"),
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
          message: t("AUTH.INVALID_TOKEN"),
        };
      }
    } catch (error) {
      console.error("Token Validation Error:", error);
      return {
        success: false,
        message: t("AUTH.TOKEN_VALIDATION_ERROR"),
      };
    }
  }
}
