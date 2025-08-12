import UserTokenModel from "../models/User/UserTokenModel";
import UserModel from "../models/User/UserModel";

import HashPassword from "../utils/hashPassword";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const secret = process.env.JWT_SECRET ?? "defaultSecret";
import { v4 as uuid } from "uuid";

export default class AuthAdminService {
  constructor() {}

  async login(tc_no: string, phone: string,type:string) {
    try {
      let user;
      user = await new UserModel().first({ tc_no });
    

      if(user&&user?.phone != phone){
        return {
          success: false,
          message: "Bu TC kimlik numarası zaten farklı bir telefon numarasıyla sisteme kayıtlı.",
        };
      }
      if(user?.deleted_at){
        return {
          success: false,
          message: "Bu hesap silinmiştir.",
        };
      }

      if (!user) {
        const exitPhone = await new UserModel().first({ phone });
        if(exitPhone){
          return {
            success: false,
            message: "Bu telefon numarası zaten kullanılıyor.",
          };
        }
        const otp =111111; //Math.floor(100000 + Math.random() * 900000);
        const otp_code_expired_at = new Date(Date.now() + 5 * 60 * 1000);
        await new UserModel().create({
          tc_no,
          phone,
          status: true,
          otp_code: otp,
          otp_code_expired_at: otp_code_expired_at,
          verify: false,
        });
        user = await new UserModel().first({ tc_no, phone });
      } else {
        const otp =111111; //Math.floor(100000 + Math.random() * 900000);
        const otp_code_expired_at = new Date(Date.now() + 5 * 60 * 1000);
        new UserModel().update(user.id, {
          otp_code: otp,
          otp_code_expired_at: otp_code_expired_at,
        });
      }

      if (user?.status == false) {
        return {
          success: false,
          message: "Kullanıcı aktif değil",
        };
      }
      let token;
      try {
        const body = {
          id:user?.id,
          verified:false,
          tc_no:user?.tc_no,
          phone:user?.phone,
        };

        token = jwt.sign(body, secret, { expiresIn: "1h" });
      } catch (error) {
        console.error("Error generating token:", error);
        return {
          success: false,
          message: "Token oluşturma hatası",
        };
      }
      await new UserTokenModel().create({
        id: uuid(),
        user_id: user?.id,
        token,
        type,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      const data = await new UserModel().userDetail(user?.id);
      return {
        success: true,
        user: data,
        token,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Belirtilen kullanıcı sistemde bulunamadı veya silinmiş olabilir.",
      };
    }
  }

  async verifyOtp(tc_no: string, phone: string,type:string, otp: string) {
    try {
      
  
    const user = await new UserModel().first({ tc_no, phone });
    if (!user) {
      return {
        success: false,
        message: "Kullanıcı bulunamadı",
      };
    }
    if (user.otp_code !== otp) {
      return {
        success: false,
        message: "OTP kodu yanlış",
      };
    }
    await new UserModel().update(user.id, {
      status: true,
      otp_code: null,
      otp_code_expired_at: null,
      verify:true,
    });
    const data = await new UserModel().userDetail(user.id);

    const body = {
      id:user?.id,
      verified:true,
      tc_no:user?.tc_no,
      phone:user?.phone,
    };

    const token = jwt.sign(body, secret, { expiresIn: "1h" });


    const firstToken = await new UserTokenModel().first({ user_id: user.id, type: type });
    if (firstToken) {
      await new UserTokenModel().delete(firstToken.id);
    }
    await new UserTokenModel().create({
      id: uuid(),
      user_id: user.id,
      token,
      type,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    

    return {
      success: true,
      user: data,
      token,
      message: "OTP kodu doğrulandı",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "OTP kodu doğrulama hatası",
    };
  } 
  }

  async register(user_id: number, name_surname: string, job_id: string, email: string) {
    try {
      const user = await new UserModel().first({ id: user_id });
      if (!user) {
        return {
          success: false,
          message: "Kullanıcı bulunamadı",
        };
      }

      const existingUser = await new UserModel().first({ email });
      if (existingUser) {
        return {
          success: false,
          message: "Bu email adresi zaten kullanılıyor",
        };
      }


      await new UserModel().update(user.id, {
        name_surname,
        job_id,
        email,
      });

      const data = await new UserModel().userDetail(user.id);

      return {
        success: true,
        user: data,
        message: "Kullanıcı başarıyla kaydedildi",
      };
      
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Kullanıcı kayıt hatası",
      };
    }
  }

  async logout(token: string) {
    const userToken = await new UserTokenModel().first({ token });
    if (!userToken) {
      return {
        success: false,
        message: "Token bulunamadı",
      };
    }
    await new UserTokenModel().delete(userToken.id);
    return {
      success: true,
      message: "Çıkış başarılı",
    };
  }

  async resendCode(tc_number: string, phone_number: string) {
    try {
      const user = await new UserModel().first({ tc_no: tc_number, phone: phone_number });
      if (!user) {
        return {
          success: false,
          message: "Kullanıcı bulunamadı",
        };
      }

      const otp =111111; //Math.floor(100000 + Math.random() * 900000);
      const otp_code_expired_at = new Date(Date.now() + 5 * 60 * 1000);
      await new UserModel().update(user.id, {
        otp_code: otp,
        otp_code_expired_at: otp_code_expired_at,
      });

      return {
        success: true,
        message: "OTP kodu gönderildi",
      };
    } catch (error) {
      return {
        success: false,
        message: "OTP kodu gönderimi hatası",
      };
    }
  }
}
