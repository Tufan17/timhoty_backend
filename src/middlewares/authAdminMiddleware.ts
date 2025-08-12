import jwt from 'jsonwebtoken';

export const authAdminMiddleware = async (req: any, res: any) => {
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


    if (payload.expires_at < new Date()) {
      return res.status(401).send({ 
        success: false,
        message: 'Token süresi doldu' 
      })
    }
    if(!payload){
      return res.status(401).send({ 
        success: false,
        message: 'Token geçersiz' 
      })
    }

      req.user = payload
      req.user.role = "admin"
  } catch (err: any) {
    if(err.message === "jwt expired"){
      return res.status(401).send({ 
        success: false,
        message: 'Token süresi doldu',
        logout: true,
        error: err
      })
    }
    return res.status(401).send({ 
      success: false,
      message: 'Token doğrulanamadı' ,
      error: err
    })
  }
}
