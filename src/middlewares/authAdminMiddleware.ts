import jwt from 'jsonwebtoken';
import { FastifyRequest, FastifyReply } from 'fastify';
import AdminTokenModel from '@/models/Admin/AdminTokenModel';

export const authAdminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      message: request.t('AUTH.TOKEN_NOT_FOUND')
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any


    if (payload.expires_at < new Date()) {
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.TOKEN_EXPIRED')
      })
    }
    if(!payload){
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.TOKEN_INVALID')
      })
    }


    const adminToken = await new AdminTokenModel().first({ token });
    if (!adminToken) {
      return reply.status(401).send({
        success: false,
        message: request.t('AUTH.TOKEN_NOT_FOUND')
      });
    }

      (request as any).user = payload;
      (request as any).user.type = "admin";
  } catch (err: any) {
    if(err.message === "jwt expired"){
      return reply.status(401).send({ 
        success: false,
        message: request.t('AUTH.TOKEN_EXPIRED'),
        logout: true,
        error: err
      })
    }
    return reply.status(401).send({ 
      success: false,
      message: request.t('AUTH.TOKEN_INVALID'),
      error: err
    })
  }
}
