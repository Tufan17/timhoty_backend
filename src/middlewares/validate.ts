import { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectSchema } from 'joi';

export const validate = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if(!req.body) {
      return res.status(400).send({
        success: false,
        message: 'Validation error',
        details: schema.describe().keys,
      });
    }

    if (error) {
      return res.status(400).send({
        success: false,
        message: 'Validation error',
        details: error?.details.map((err) => err.message),
      });
    }

    req.body = value;
  };
};
