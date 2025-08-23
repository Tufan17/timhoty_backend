import { saveUploadedFile } from '@/utils/fileUpload';
import { FastifyRequest, FastifyReply } from 'fastify';
import { ObjectSchema } from 'joi';
import { languageMiddleware } from './languageMiddleware';

export const validateFormData = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    await languageMiddleware(req, res);
    const t = (req as any).t;

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
        message: t('VALIDATION_ERROR'),
        details: error.details.map((err) => err.message),
      });
    }

    req.body = value;
  };
};

export const validateFormDataMultiple = (schema: ObjectSchema) => {
  return async (req: FastifyRequest, res: FastifyReply) => {
    await languageMiddleware(req, res);
    const t = (req as any).t;

    const parts = req.parts();

    const fields: Record<string, any> = {};
    
    for await (const part of parts) {
      if (part.type === "file") {
        try {
          const uploadedFile = await saveUploadedFile(part, req.url.replace("/", ""));
          
          // Check if fieldname already exists (multiple files with same field name)
          if (fields[part.fieldname]) {
            // Convert to array if not already
            if (!Array.isArray(fields[part.fieldname])) {
              fields[part.fieldname] = [fields[part.fieldname]];
            }
            fields[part.fieldname].push(uploadedFile);
          } else {
            fields[part.fieldname] = uploadedFile;
          }
        } catch (error) {
          console.error('Error uploading file:', error);
          return res.status(500).send({
            success: false,
            message: t('FILE_UPLOAD_ERROR'),
            details: error instanceof Error ? error.message : 'Unknown file upload error',
          });
        }
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
        message: t('VALIDATION_ERROR'),
        details: error.details.map((err) => err.message),
      });
    }

    req.body = value;
  };
};
