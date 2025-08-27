
import UserModel from "@/models/UserModel.js";
import HashPassword from "@/utils/hashPassword";
import jwt from "jsonwebtoken";
import UserTokensModel from "@/models/UserTokensModel";

export default class AuthUserService {

  async accessTokenRenew(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as any;

      if (!decoded) {
        return {
          success: false,
          message: "Invalid refresh token"
        };
      }

      if (decoded.expires_at < new Date()) {
        return {
          success: false,
          message: "Refresh token expired"
        };
      }

      const userToken = await new UserTokensModel().first({
        user_id: decoded.id,
        deleted_at: null,
        revoked_at: null
      })

      if (!userToken) {
        return {
          success: false,
          message: "Refresh token record is not found"
        };
      }

      const body = {
        id: decoded.id,
        name_surname: decoded.name_surname,
        language: decoded.language,
        email: decoded.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      const accessToken = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
      return {
        success: true,
        message: "Access token renewed",
        accessToken,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error in accessTokenRenew"
      };
    }
  }

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      const user = await new UserModel().first({ email });
      if (!user) {
        return {
          success: false,
          message: t("AUTH.USER_NOT_FOUND"),
        };
      }
      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      const token = jwt.sign(body, process.env.JWT_SECRET!, { expiresIn: "1d" });
      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        data: user,
        token,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.LOGIN_ERROR"),
      };
    }
  }


  async register(name_surname: string, email: string, password: string, language: string, device_name: string, t: (key: string) => string) {
    try {
      const existingUser = await new UserModel().exists({ email });
      if (existingUser) {
        return {
          success: false,
          message: "Bu email zaten kullanılıyor",
        };
      }

      const passwordHash = HashPassword(password);

      const user = await new UserModel().create({
        name_surname,
        email,
        password: passwordHash,
        language,
      });

      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const ACCESS_TOKEN = jwt.sign(body, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
      const REFRESH_TOKEN = jwt.sign(body, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "1d" });

      await new UserTokensModel().create({
        user_id: user.id,
        token_hash: REFRESH_TOKEN,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        device_name: device_name,
      });

      return {
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: user,
        accessToken: ACCESS_TOKEN,
        refreshToken: REFRESH_TOKEN,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: t("AUTH.REGISTER_ERROR"),
      };
    }
  }

  async logout(t: (key: string) => string) {
    try {
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
}



/*

import UserModel from "@/models/UserModel.js";
import UserRefreshTokenModel from "@/models/UserSessionsModel";
import HashPassword from "@/utils/hashPassword";
import jwt from "jsonwebtoken";
import crypto from "crypto"; // refresh token'ı hash'lemek için
import connection from '../db/connection';

export default class AuthUserService {

  async login(email: string, password: string, user_agent: string,  t: (key: string) => string) {
    try {
      const user = await new UserModel().first({ email });
      if (!user) {
        return {
          success: false,
          message: "Kullanıcı bulunamadı",
        };
      }
      // TODO: ŞİFRE YANLIŞ İSE GİRİŞ YAPMASINA İZİN VERME
      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      // Access token oluştur (15 dakika)
      const accessToken = jwt.sign(body, String(process.env.ACCESS_TOKEN_SECRET), { 
        expiresIn: "15m" 
      });

      // Refresh token oluştur (15 gün)
      const refreshToken = jwt.sign(body, String(process.env.REFRESH_TOKEN_SECRET), { 
        expiresIn: "15d" 
      });

      // Refresh token'ı veritabanına kaydet
      await new UserRefreshTokenModel().create({
        user_id: user.id,
        token_hash: refreshToken,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün
        device_name: user_agent
      });
      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        data: user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.LOGIN_ERROR"),
      };
    }
  }


  async register(name_surname: string, email: string, password: string, language: string, user_agent: string, t: (key: string) => string) {
    try {
      const existingUser = await new UserModel().exists({ email });
      if (existingUser) {
        return {
          success: false,
          message: "Bu email zaten kullanılıyor",
        };
      }
      const passwordHash = HashPassword(password);

      const user = await new UserModel().create({
        name_surname,
        email,
        password: passwordHash,
        language
      });

      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      // Access token oluştur (15 dakika)
      const accessToken = jwt.sign(body, String(process.env.ACCESS_TOKEN_SECRET), { 
        expiresIn: "15m" 
      });

      // Refresh token oluştur (15 gün)
      const refreshToken = jwt.sign(body, String(process.env.REFRESH_TOKEN_SECRET), { 
        expiresIn: "15d" 
      });

      // Refresh token'ı veritabanına kaydet
      await new UserRefreshTokenModel().create({
        user_id: user.id,
        token_hash: refreshToken,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün
        device_name: user_agent
      });

      return {
        success: true,
        message: "Kullanıcı başarıyla oluşturuldu",
        data: user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.REGISTER_ERROR"),
      };
    }
  }

  // Yeni access token alma metodu
  async refreshToken(refreshToken: string) {
    try {
      // Refresh token'ı verify et
      const decoded = jwt.verify(refreshToken, String(process.env.REFRESH_TOKEN_SECRET)) as any;

      // Veritabanında token'ı kontrol et
      const tokenRecord = await new UserRefreshTokenModel().first({
        token_hash: decoded,
        user_id: decoded.id
      });

      // Token geçerli değilse veya revoke edilmişse hata ver
      if (!tokenRecord || tokenRecord.revoked_at || new Date(tokenRecord.expires_at) < new Date()) {
        return {
          success: false,
          message: "Invalid refresh token"
        };
      }

      // Kullanıcı bilgilerini al
      const user = await new UserModel().first({ id: decoded.id });
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      // Yeni access token oluştur
      const body = {
        id: user.id,
        name_surname: user.name_surname,
        language: user.language,
        email: user.email,
      };

      const accessToken = jwt.sign(body, String(process.env.ACCESS_TOKEN_SECRET), { 
        expiresIn: "15m" 
      });

      return {
        success: true,
        accessToken
      };
    } catch (error) {
      return {
        success: false,
        message: "Invalid refresh token"
      };
    }
  }

  // Logout metodu
  async logout(userId: string, refreshToken: string,user_agent: string,) {
    try {
      console.log(userId, refreshToken, user_agent);
      // Token'ı revoke et
      const result = await connection
        .table("user_sessions")
        .where({ 
          user_id: userId,
          device_name: user_agent
        })
        .update({ revoked_at: new Date() })
        .returning('*');
  
      if (!result.length) {
        throw new Error("Token revoke failed");
      }
  
      return {
        success: true,
        message: "Logged out successfully"
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Logout failed"
      };
    }
  }
}
*/