import { saveUploadedFile } from '@/utils/fileUpload';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectSchema } from 'joi';

export const validateFormData = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const parts = req.parts();

    const fields: Record<string, any> = {};
    
    for await (const part of parts) {
      if (part.type === "file") {
          fields[part.fieldname] = await saveUploadedFile(part, req.url.replace("/", ""));
      } else {
        let value: any = part.value as string;
        
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) value = date;
        }
        
        fields[part.fieldname] = value;
      }
    }

    const { error, value } = schema.validate(fields, { abortEarly: false });

    if (error) {
      return res.status(400).send({
        success: false,
        message: 'Validation error',
        details: error.details.map((err) => err.message),
      });
    }

    req.body = value;
  };
};
