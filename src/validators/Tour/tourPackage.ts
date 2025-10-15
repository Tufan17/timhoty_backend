import Joi from 'joi';

const priceSchemata = Joi.object({
    main_price: Joi.number().positive().required(),
    child_price: Joi.number().positive().optional(),
    currency_id: Joi.string().uuid().required(),
    start_date: Joi.date().iso().optional().allow(null),
    end_date: Joi.date().iso().optional().allow(null),
    period: Joi.string().optional().allow(null),
    quota: Joi.number().optional().allow(null),
    baby_price: Joi.number().positive().optional(),
    discount: Joi.number().min(0).max(100).optional(),
    total_tax_amount: Joi.number().min(0).optional()

});

export const tourPackageSchema = Joi.object({
    tour_id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().required(),
    refund_policy: Joi.string().required(),
    return_acceptance_period: Joi.number().required(),
});

export const tourPackageUpdateSchema = Joi.object({
    return_acceptance_period: Joi.number().optional(),
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    refund_policy: Joi.string().optional(),
});

export const tourPackageQuerySchema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).max(100).optional(),
    search: Joi.string().optional(),
    tour_id: Joi.string().uuid().optional()
});
