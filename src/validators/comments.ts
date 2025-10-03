import Joi from 'joi';

export const createCommentSchema = Joi.object({
  reservation_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Reservation ID must be a valid UUID',
      'any.required': 'Reservation ID is required'
    }),
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
    }),
  comment: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Comment must be at least 10 characters long',
      'string.max': 'Comment must not exceed 1000 characters',
      'any.required': 'Comment is required'
    }),
  rating: Joi.number()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5',
      'any.required': 'Rating is required'
    })
});

export const updateCommentSchema = Joi.object({
  comment: Joi.string()
    .min(10)
    .max(1000)
    .optional()
    .messages({
      'string.min': 'Comment must be at least 10 characters long',
      'string.max': 'Comment must not exceed 1000 characters'
    }),
  rating: Joi.number()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating must be at most 5'
    })
}).or('comment', 'rating');

export const getCommentsByServiceSchema = Joi.object({
  reservation_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Reservation ID must be a valid UUID',
      'any.required': 'Reservation ID is required'
    }),
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

export const getRatingStatsSchema = Joi.object({
  reservation_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Reservation ID must be a valid UUID',
      'any.required': 'Reservation ID is required'
    }),
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

export const getRecentCommentsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must be at most 50'
    })
});

export const commentIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Comment ID must be a valid UUID',
      'any.required': 'Comment ID is required'
    })
});
