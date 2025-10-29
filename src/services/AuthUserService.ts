import sendMail from "@/utils/mailer";
import UserModel from "@/models/UserModel.js";
import HashPassword from "@/utils/hashPassword";
import jwt from "jsonwebtoken";
import UserTokensModel from "@/models/UserTokensModel";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

export default class AuthUserService {
  async accessTokenRenew(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as any;

      if (!decoded) {
        return {
          success: false,
          message: "Invalid refresh token",
        };
      }

      if (decoded.expires_at < new Date()) {
        return {
          success: false,
          message: "Refresh token expired",
        };
      }

      const userToken = await new UserTokensModel().first({
        user_id: decoded.id,
        deleted_at: null,
        revoked_at: null,
      });

      if (!userToken) {
        return {
          success: false,
          message: "Refresh token record is not found",
        };
      }

      const body = {
        id: decoded.id,
        name_surname: decoded.name_surname,
        language: decoded.language,
        email: decoded.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
      });
      const newRefreshToken = jwt.sign(
        body,
        process.env.REFRESH_TOKEN_SECRET!,
        { expiresIn: "7d" }
      );
      return {
        success: true,
        message: "Access token renewed",
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error in accessTokenRenew",
      };
    }
  }

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      const user = await new UserModel().first({ email });
      // console.log("user", user)
      if (!user) {
        return {
          success: false,
          message: t("AUTH.USER_NOT_FOUND"),
        };
      }
      // console.log(HashPassword(password), user.password)
      if (user.password !== HashPassword(password)) {
        return {
          success: false,
          message: t("AUTH.INVALID_PASSWORD"),
        };
      }

      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
      });
      const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      // Kullanıcının mevcut token kaydını bul (revoked olanlar dahil)
      const existingToken = await new UserTokensModel().first({
        user_id: user.id,
      });

      if (existingToken) {
        // Mevcut kaydı güncelle - revoked_at'i null yap ve yeni token'ı kaydet
        await new UserTokensModel().update(existingToken.id, {
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked_at: null,
        });
      } else {
        // Hiç kayıt yoksa yeni oluştur
        await new UserTokensModel().create({
          user_id: user.id,
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      user.access_token = accessToken;
      user.refresh_token = refreshToken;
      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.LOGIN_ERROR"),
      };
    }
  }

  async register(
    name_surname: string,
    email: string,
    password: string,
    language: string,
    t: (key: string) => string
  ) {
    try {
      const existingUser = await new UserModel().exists({ email });
      if (existingUser) {
        return {
          success: false,
          message: "Bu email zaten kullanılıyor",
        };
      }

      const user = await new UserModel().create({
        name_surname,
        email,
        password: password,
        language,
        avatar: "/uploads/avatar.png",
      });
      try {
        const sendMail = (await import("@/utils/mailer")).default;
        const path = require("path");
        const fs = require("fs");
        const emailTemplatePath = path.join(process.cwd(), "emails", "register.html");
        const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8");

        const uploadsUrl = process.env.UPLOADS_URL;
        let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl);

        html = html.replace(/\{\{name\}\}/g, name_surname);

        await sendMail(email, "Timhoty'ye Hoş Geldiniz", html);
      } catch (error) {
        console.error("Register email error:", error);
      }

      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      sendMail(
        user.email,
        t("AUTH.REGISTER_SUCCESS"),
        t("AUTH.REGISTER_SUCCESS_DESCRIPTION")
      );

      const ACCESS_TOKEN = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
      });
      const REFRESH_TOKEN = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      await new UserTokensModel().create({
        user_id: user.id,
        token_hash: REFRESH_TOKEN,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      user.access_token = ACCESS_TOKEN;
      user.refresh_token = REFRESH_TOKEN;

      return {
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: user,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: t("AUTH.REGISTER_ERROR"),
      };
    }
  }

  async logout(accessToken: string, t: (key: string) => string) {
    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET!
      ) as any;
      const user = await new UserTokensModel().first({
        user_id: decoded.id,
        deleted_at: null,
        revoked_at: null,
      });

      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      await new UserTokensModel().update(user.id, {
        revoked_at: new Date(),
      });

      return {
        success: true,
        message: t("AUTH.LOGOUT_SUCCESS"),
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.LOGOUT_ERROR"),
      };
    }
  }

  async forgotPassword(email: string, t: (key: string) => string) {
    try {
      const user = await new UserModel().first({ email });
      if (!user) {
        return {
          success: false,
          message: t("AUTH.USER_NOT_FOUND"),
        };
      }
      // 6 haneli rastgele bir sayı oluştur
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      sendMail(
        user.email,
        t("AUTH.FORGOT_PASSWORD_SUCCESS"),
        verificationCode.toString()
      );

      // 15 dakika sonra verification_code_expires_at'i null yap
      user.verification_code_expires_at = new Date(Date.now() + 15 * 60 * 1000);

      await new UserModel().update(user.id, {
        verification_code: verificationCode,
        verification_code_expires_at: user.verification_code_expires_at,
      });
      return {
        success: true,
        message: t("AUTH.FORGOT_PASSWORD_SUCCESS"),
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.FORGOT_PASSWORD_ERROR"),
      };
    }
  }

  async resetPassword(
    email: string,
    code: string,
    password: string,
    t: (key: string) => string
  ) {
    try {
      const user = await new UserModel().first({
        email,
        verification_code: code,
      });
      if (!user) {
        return {
          success: false,
          message: t("AUTH.USER_NOT_FOUND"),
        };
      }
      await new UserModel().update(user.id, {
        password: password,
      });
      return {
        success: true,
        message: t("AUTH.RESET_PASSWORD_SUCCESS"),
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.RESET_PASSWORD_ERROR"),
      };
    }
  }

  async googleLogin(credential: string, t: (key: string) => string) {
    try {
      // Google OAuth2Client oluştur
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

      // Token'ı verify et ve decode et
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return {
          success: false,
          message: t("AUTH.GOOGLE_LOGIN_ERROR"),
        };
      }

      // Kullanıcı bilgileri
      const googleEmail = payload.email;
      const googleName = payload.name || "";
      const googlePicture = payload.picture || "/uploads/avatar.png";
      const emailVerified = payload.email_verified || false;

      // Kullanıcı zaten kayıtlı mı kontrol et
      let user = await new UserModel().first({ email: googleEmail });

      if (!user) {
        // Yeni kullanıcı oluştur
        user = await new UserModel().create({
          name_surname: googleName,
          email: googleEmail,
          password: HashPassword(Math.random().toString(36).substring(2, 15)), // Random password
          language: "tr",
          avatar: googlePicture,
          email_verified: emailVerified,
        });

        try {
          const sendMail = (await import("@/utils/mailer")).default;
          const path = require("path");
          const fs = require("fs");
          const emailTemplatePath = path.join(process.cwd(), "emails", "register.html");
          const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8");
  

          const uploadsUrl = process.env.UPLOADS_URL;
          let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl);

          html = html.replace(/\{\{name\}\}/g, googleName);

          await sendMail(googleEmail, "Timhoty'ye Hoş Geldiniz", html);
        } catch (error) {
          console.error("Register email error:", error);
        }
      }

      if (!user) {
        return {
          success: false,
          message: t("AUTH.GOOGLE_LOGIN_ERROR"),
        };
      }

      // JWT token oluştur
      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
      });
      const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      // Token kaydını güncelle veya oluştur
      const existingToken = await new UserTokensModel().first({
        user_id: user.id,
      });

      if (existingToken) {
        await new UserTokensModel().update(existingToken.id, {
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked_at: null,
        });
      } else {
        await new UserTokensModel().create({
          user_id: user.id,
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      user.access_token = accessToken;
      user.refresh_token = refreshToken;

      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        data: user,
      };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        message: t("AUTH.GOOGLE_LOGIN_ERROR"),
      };
    }
  }

  async facebookLogin(
    accessToken: string,
    userID: string,
    t: (key: string) => string
  ) {
    try {
      // Facebook Graph API'den kullanıcı bilgilerini al
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );

      const { id, name, email, picture } = response.data;

      if (!email) {
        return {
          success: false,
          message: t("AUTH.FACEBOOK_EMAIL_REQUIRED"),
        };
      }

      // Kullanıcı bilgileri
      const facebookEmail = email;
      const facebookName = name || "";
      const facebookPicture = picture?.data?.url || "/uploads/avatar.png";

      // Kullanıcı zaten kayıtlı mı kontrol et
      let user = await new UserModel().first({ email: facebookEmail });

      if (!user) {
        // Yeni kullanıcı oluştur
        user = await new UserModel().create({
          name_surname: facebookName,
          email: facebookEmail,
          password: HashPassword(Math.random().toString(36).substring(2, 15)), // Random password
          language: "tr",
          avatar: facebookPicture,
          email_verified: true, // Facebook'tan gelen email'ler verify edilmiş kabul ediyoruz
        });

        try {
          const sendMail = (await import("@/utils/mailer")).default;
          const path = require("path");
          const fs = require("fs");
          const emailTemplatePath = path.join(process.cwd(), "emails", "register.html");
        const testEmailHtml = fs.readFileSync(emailTemplatePath, "utf8");


          const uploadsUrl = process.env.UPLOADS_URL;
          let html = testEmailHtml.replace(/\{\{uploads_url\}\}/g, uploadsUrl);

          html = html.replace(/\{\{name\}\}/g, facebookName);

          await sendMail(facebookEmail, "Timhoty'ye Hoş Geldiniz", html);
        } catch (error) {
          console.error("Register email error:", error);
        }
      }

      if (!user) {
        return {
          success: false,
          message: t("AUTH.FACEBOOK_LOGIN_ERROR"),
        };
      }

      // JWT token oluştur
      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const jwtAccessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: "1d",
      });
      const refreshToken = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: "7d",
      });

      // Token kaydını güncelle veya oluştur
      const existingToken = await new UserTokensModel().first({
        user_id: user.id,
      });

      if (existingToken) {
        await new UserTokensModel().update(existingToken.id, {
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked_at: null,
        });
      } else {
        await new UserTokensModel().create({
          user_id: user.id,
          token_hash: refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      user.access_token = jwtAccessToken;
      user.refresh_token = refreshToken;

      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        data: user,
      };
    } catch (error) {
      console.error("Facebook login error:", error);
      return {
        success: false,
        message: t("AUTH.FACEBOOK_LOGIN_ERROR"),
      };
    }
  }
}
