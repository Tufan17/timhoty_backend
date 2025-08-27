import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import UserTokensModel from '@/models/UserTokensModel';

export const authUserMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: request.t('AUTH.TOKEN_NOT_FOUND')
    })
  }
  
  const accessToken = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as any

    if(!payload){
      return reply.status(401).send({ 
        success: false,
        message: "Access token invalid"
      })
    }

    if (payload.expires_at < new Date()) {
      return reply.status(401).send({ 
        success: false,
        message: "Access token expired"
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
        message: "Refresh token record is not found"
      })
    }

      (request as any).user = payload;
      (request as any).user.type = "user";
  } catch  {
    return reply.status(401).send({ 
      success: false,
      message: "Error in authUserMiddleware",
    })
  }
}
