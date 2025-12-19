import Joi from 'joi';
import { FastifyRequest, FastifyReply } from 'fastify';

export class AuthValidation {
    static register = async (req: FastifyRequest, res: FastifyReply) => {
        try {
            const schema = Joi.object({
                name_surname: Joi.string().trim().min(3).max(60).required().messages({
                    'string.empty': 'Ad Soyad is required',
                    'string.base': 'Ad Soyad should be a string',
                    'string.min': 'Ad Soyad should have a minimum length of {#limit}',
                    'string.max': 'Ad Soyad should have a maximum length of {#limit}',
                    'any.required': 'name_surname field is required (String)',
                }),
                email: Joi.string().email().trim().min(3).max(50).required().messages({
                    'string.empty': 'Email is required',
                    'string.base': 'Email should be a string',
                    'string.email': 'Email is invalid',
                    'string.min': 'Email should have a minimum length of {#limit}',
                    'string.max': 'Email should have a maximum length of {#limit}',
                    'any.required': 'email field is required (String)',
                }),
                language: Joi.string().trim().valid('tr', 'en', 'ar').required().messages({
                    'string.empty': 'Language is required',
                    'string.base': 'Language should be a string',
                    'any.only': 'Language must be one of: tr, en, ar',
                    'any.required': 'language field is required (String)',
                }),
                password: Joi.string().trim().min(6).max(50).required().messages({
                    'string.empty': 'Password is required',
                    'string.base': 'Password should be a string',
                    'string.min': 'Password should have a minimum length of {#limit}',
                    'string.max': 'Password should have a maximum length of {#limit}',
                    'any.required': 'password field is required (String)',
                }),
                deviceId: Joi.string().trim().optional().messages({
                    'string.empty': 'Device ID is required',
                    'string.base': 'Device ID should be a string',
                    'any.required': 'deviceId field is required (String)',
                }),
            });
            await schema.validateAsync(req.body);
        } catch (error) {
            return res.status(400).send({
                success: false,
                message: (error as Error).message,
            });
        }
    };

    static login = async (req: FastifyRequest, res: FastifyReply) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().trim().min(3).max(50).required().messages({
                    'string.empty': 'Email is required',
                    'string.base': 'Email should be a string',
                    'string.email': 'Email is invalid',
                    'string.min': 'Email should have a minimum length of {#limit}',
                    'string.max': 'Email should have a maximum length of {#limit}',
                    'any.required': 'email field is required (String)',
                }),
                password: Joi.string().trim().min(6).max(50).required().messages({
                    'string.empty': 'Password is required',
                    'string.base': 'Password should be a string',
                    'string.min': 'Password should have a minimum length of {#limit}',
                    'string.max': 'Password should have a maximum length of {#limit}',
                    'any.required': 'password field is required (String)',
                }),
            });
            await schema.validateAsync(req.body);
        } catch (error) {
            return res.status(400).send({
                success: false,
                message: (error as Error).message,
            });
        }
    };
}
