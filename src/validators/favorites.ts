import Joi from 'joi';

export const toggleFavoriteSchema = Joi.object({
  service_type: Joi.string()
    .valid('hotel', 'car_rental', 'activity', 'tour', 'visa')
    .required()
    .messages({
      'any.only': 'Service type must be one of: hotel, car_rental, activity, tour, visa',
      'any.required': 'Service type is required'
    }),
  service_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Service ID must be a valid UUID',
      'any.required': 'Service ID is required'
    })
});
