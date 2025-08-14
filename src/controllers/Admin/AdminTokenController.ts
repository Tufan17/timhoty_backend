import AdminTokenModel from "@/models/Admin/AdminTokenModel";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "defaultSecret";

export default class AdminTokenController {
  async changeLanguage(
    token: string,
    language: string,
    user: {
      id: string;
      name_surname: string;
      email: string;
    }
  ) {
    try {
      const existingToken = await new AdminTokenModel().first({ token });
      if (!existingToken) {
        throw new Error("Token not found");
      }
      let newToken;
      try {
        const body = {
          id: user.id,
          language: language,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        newToken = jwt.sign(body, secret, { expiresIn: "1h" });
      } catch (error) {
        console.error("Error generating token:", error);
        return {
          success: false,
          message: "Token oluşturma hatası",
        };
      }
      const week = 7 * 24 * 60 * 60 * 1000; //1 hafta

      await new AdminTokenModel().update(existingToken.id, {
        token: newToken,
        expires_at: new Date(Date.now() + week),
      });

      return {
        success: true,
        message: "Language changed successfully",
        token: newToken,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Language change failed",
      };
    }
  }
}
