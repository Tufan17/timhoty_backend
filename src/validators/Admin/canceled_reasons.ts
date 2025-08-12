import Joi from 'joi';

export const canceledReasonSchema = Joi.object({
  name: Joi.string().required(),
  insurance_type_id: Joi.string().required(),
});


export const canceledReasonUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  insurance_type_id: Joi.string().optional(),
})