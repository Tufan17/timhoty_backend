
import UserModel from "@/models/UserModel.js";
import HashPassword from "@/utils/hashPassword";
import jwt from "jsonwebtoken";

export default class AuthUserService {

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


  async register(name_surname: string, email: string, password: string, language: string, t: (key: string) => string) {
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
      });

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
        message: "Kullanıcı başarıyla oluşturuldu",
        data: user,
        token,
      };
    } catch (error) {
      return {
        success: false,
        message: t("AUTH.REGISTER_ERROR"),
      };
    }
  }
}
