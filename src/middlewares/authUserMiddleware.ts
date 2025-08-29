import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import UserTokensModel from '@/models/UserTokensModel';

export const authUserMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: request.t('AUTH.TOKEN_NOT_FOUND'),
      error_code: 'TOKEN_MISSING'
    })
  }
  
  const accessToken = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as any

    if(!payload){
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.INVALID_TOKEN'),
        error_code: 'TOKEN_INVALID'
      })
    }

    if (payload.expires_at < new Date()) {
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.TOKEN_EXPIRED'),
        error_code: 'TOKEN_EXPIRED',
        should_refresh: true
      })
    }
    
    const refreshToken = await new UserTokensModel().first({
      user_id: payload.id,
      deleted_at: null,
      revoked_at: null
    })

    if(!refreshToken){
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.REFRESH_TOKEN_NOT_FOUND'),
        error_code: 'REFRESH_TOKEN_NOT_FOUND'
      })
    }

    (request as any).user = payload;
    (request as any).user.type = "user";

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        success: false,
        message: "Oturum Süresi Doldu",
        error_code: 'TOKEN_EXPIRED',
        should_refresh: true,
        expiredAt: error.expiredAt
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return reply.status(401).send({
        success: false,
        message: request.t('AUTH.INVALID_TOKEN'),
        error_code: 'TOKEN_INVALID'
      });
    }

    return reply.status(401).send({ 
      success: false,
      message: request.t('AUTH.SESSION_ERROR'),
      error_code: 'AUTH_ERROR'
    })
  }
}
