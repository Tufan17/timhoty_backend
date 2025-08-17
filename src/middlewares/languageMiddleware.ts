import { FastifyRequest, FastifyReply } from 'fastify';
import i18n from "../utils/i18n";
import knex from '@/db/knex';


export const languageMiddleware = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    // Accept-Language header'ından dil kodunu çıkar
    let language = req.headers["accept-language"] || "tr";
    
    // Accept-Language header'ı "en-US,en;q=0.9,tr;q=0.8" gibi olabilir
    // Sadece ilk dil kodunu al
    if (language.includes(',')) {
      language = language.split(',')[0];
    }
    if (language.includes('-')) {
      language = language.split('-')[0];
    }
    
    (req as any).t = i18n(language);
    (req as any).language = language;
    
  } catch (error) {
    console.error('Language middleware error:', error);
    // Fallback: basit bir t fonksiyonu
    (req as any).t = (key: string) => key;
    (req as any).language = "tr";
  }
};