import { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectSchema } from 'joi';

export const validateQuery = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      return res.status(400).send({
        success: false,
        message: 'Validation error',
        details: error.details.map((err) => err.message),
      });
    }

    req.query = value;
  };
};
