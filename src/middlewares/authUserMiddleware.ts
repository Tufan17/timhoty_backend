import jwt from 'jsonwebtoken';
import db from '../db/connection';

export const authUserMiddleware = async (req: any, res: any) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).send({ 
      success: false,
      message: 'Token yok' 
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any

      const allowedPath = '/auth/user/verify';
      if (payload.verified === false&&req.raw.url !== allowedPath) {
        return res.status(401).send({
          login: false,
          success: false,
          message: 'Kullanıcı OTP kodunu doğrulamamış',
        });
      }

    const dbToken = await db('user_tokens')
      .where({ user_id: payload.id, token })
      .first()

    if (!dbToken) {
      return res.status(401).send({ 
        login: false,
        success: false,
        message: 'Token geçersiz' 
      })
    }

    req.user = payload
  } catch (err) {
    return res.status(401).send({ 
      login: false,
      success: false,
      message: 'Token doğrulanamadı' 
    })
  }
}
