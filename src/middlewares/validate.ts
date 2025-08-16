import { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectSchema } from 'joi';
import { languageMiddleware } from './languageMiddleware';

export const validate = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    await languageMiddleware(req, res);
    const t = (req as any).t;

    if(!req.body) {
      return res.status(400).send({
        success: false,
        message: t('VALIDATION_ERROR'),
        details: schema.describe().keys,
      });
    }

    if (error) {
      return res.status(400).send({
        success: false,
        message: t('VALIDATION_ERROR'),
        details: error?.details.map((err) => err.message),
      });
    }

    req.body = value;
  };
};
