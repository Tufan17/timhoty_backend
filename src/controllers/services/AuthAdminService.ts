import AdminTokenModel from "../../models/Admin/AdminTokenModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const secret = process.env.JWT_SECRET ?? "defaultSecret";
import { v4 as uuid } from "uuid";
import AdminModel from "@/models/Admin/AdminModel";
import HashPassword from "@/utils/hashPassword";
import PermissionModel from "@/models/PermissionModel.js";

export default class AuthAdminService {
  constructor() {}

  async login(email: string, password: string, t: (key: string) => string) {
    try {
      const admin = await new AdminModel().first({ email });
      if (!admin) {
        return {
          success: false,
          message: t("AUTH.ADMIN_NOT_FOUND"),
        };
      }
      const isPasswordValid = HashPassword(password) === admin.password;
      if (!isPasswordValid) {
        return {
          success: false,
          message: t("AUTH.INVALID_PASSWORD"),
        };
      }
      let token;
      try {
        const body = {
          id: admin.id,
          name_surname: admin.name_surname,
          language: admin.language,
          email: admin.email,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        token = jwt.sign(body, secret, { expiresIn: "1h" });
      } catch (error) {
        console.error("Error generating token:", error);
        return {
          success: false,
          message: t("AUTH.TOKEN_GENERATION_ERROR"),
        };
      }
      const week = 7 * 24 * 60 * 60 * 1000; //1 hafta

      await new AdminTokenModel().create({
        id: uuid(),
        admin_id: admin.id,
        token,
        expires_at: new Date(Date.now() + week),
      });

      const permissions = await new PermissionModel().getAdminPermissions(
        admin.id
      );

      return {
        success: true,
        message: t("AUTH.LOGIN_SUCCESS"),
        user: {
          id: admin.id,
          name_surname: admin.name_surname,
          email: admin.email,
          phone: admin.phone,
          language: admin.language,
          status: admin.status,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
          deleted_at: admin.deleted_at,
        },
        permissions: permissions,
        token,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.LOGIN_ERROR"),
      };
    }
  }

  async logout(token: string, t: (key: string) => string) {
    const adminToken = await new AdminTokenModel().first({ token });
    if (!adminToken) {
      return {
        success: false,
        message: t("AUTH.TOKEN_NOT_FOUND"),
      };
    }
    await new AdminTokenModel().delete(adminToken.id);
    return {
      success: true,
      message: t("AUTH.LOGOUT_SUCCESS"),
    };
  }
}
