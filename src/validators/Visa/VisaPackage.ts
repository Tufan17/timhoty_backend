import Joi from 'joi';

const priceSchema = Joi.object({
    main_price: Joi.number().positive().required(),
    child_price: Joi.number().positive().optional(),
    currency_id: Joi.string().uuid().required(),
    start_date: Joi.date().iso().required().allow(null),
    end_date: Joi.date().iso().required().allow(null)
});

export const visaPackageSchema = Joi.object({
    visa_id: Joi.string().uuid().required(),
    discount: Joi.number().min(0).max(100).optional(),
    total_tax_amount: Joi.number().min(0).optional(),
    constant_price: Joi.boolean().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    refund_policy: Joi.string().required(),
    refund_days: Joi.number().required(),
    prices: Joi.array().items(priceSchema).min(1).required()
});

export const visaPackageUpdateSchema = Joi.object({
    discount: Joi.number().min(0).max(100).optional(),
    total_tax_amount: Joi.number().min(0).optional(),
    constant_price: Joi.boolean().optional(),
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    refund_policy: Joi.string().optional(),
    refund_days: Joi.number().optional(),
    prices: Joi.array().items(priceSchema).min(1).optional()
});

export const visaPackageQuerySchema = Joi.object({
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional(),
    visa_id: Joi.string().uuid().optional(),
});