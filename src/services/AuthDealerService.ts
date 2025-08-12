import DealerTokenModel from '../models/Dealer/DealerTokenModel';
import DealerModel from '../models/Dealer/DealerModel';
import DealerUserModel from '../models/Dealer/DealerUserModel';

import HashPassword from '../utils/hashPassword';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const secret = process.env.JWT_SECRET ?? 'defaultSecret';
import { v4 as uuid } from 'uuid';
import PermissionModel from '../models/Admin/PermissionModel';

export default class AuthAdminService {
  constructor() {}

  async login(email: string, password: string) {
    try {
      const dealerUser = await new DealerUserModel().first({ email });
      if (!dealerUser) {
        return {
        success: false,
        message: 'Bayi kullanıcısı bulunamadı',
      };
    }
    if(dealerUser.status == false){
      return {
        success: false,
        message: 'Bayi kullanıcısı aktif değil',
      };
    }
    if(dealerUser.verify == false){
      return {
        success: false,
        message: 'Bayi kullanıcısı doğrulanmamış',
      };
    }
    const dealer = await new DealerModel().first({ id: dealerUser.dealer_id });
    if (!dealer) {
      return {
        success: false,
        message: 'Bayi bulunamadı',
      };
    }
    
    if(dealer.status == false){
      return {
        success: false,
        message: 'Bayi aktif değil',
      };
    }
    if(dealer.verify == false){
      return {
        success: false,
        message: 'Bayi doğrulanmamış',
      };
    }
    const isPasswordValid = await HashPassword(password) === dealerUser.password;
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Şifre yanlış',
      };
    }
    let token;
    try {
        const body = {
            id: dealerUser.id,
            dealer_id: dealer.id,
            role: dealerUser.type,
            name_surname: dealerUser.name_surname,
            email: dealerUser.email,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),//1 gün
        }

      token = jwt.sign(
        body, 
        secret,             
        { expiresIn: "1h" }       
      );
    } catch (error) {
      console.error('Error generating token:', error);
      return {
        success: false,
        message: 'Token oluşturma hatası',
      };
    }
    const week =  24 * 60 * 60 * 1000;
    await new DealerTokenModel().create({
      id: uuid(),
      dealer_id: dealer.id,
      token,
      expires_at: new Date(Date.now() + week),
    });

    let permissions = await new PermissionModel().getDealerPermissions(dealerUser.id);
   
    return {
        success: true,
        user:{
        id: dealerUser.id,
        name_surname: dealerUser.name_surname,
        email: dealerUser.email,
        dealer_id: dealer.id,
        role: dealerUser.type,
        permissions: permissions,
        created_at: dealerUser.created_at,
        updated_at: dealerUser.updated_at,
        deleted_at: dealerUser.deleted_at,
    }, token };    
  } catch (error) {
    return {
      success: false,
      message: 'Giriş hatası',
    };
  }
}

  async logout(token: string) {
    const dealerToken = await new DealerTokenModel().first({ token });
    if (!dealerToken) {
      return {
        success: false,
        message: 'Token bulunamadı',
      };
    }   
    await new DealerTokenModel().delete(dealerToken.id);
    return {
      success: true,
      message: 'Çıkış başarılı',
    };
  }
}       