const Joi = require('joi');

module.exports = {
    loginSchema: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])'))
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one special character',
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
        })
    }),

    registerSchema: Joi.object({
        username: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string()
        .min(8)
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])'))
        .required()
        .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one special character',
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required'
        })
    })
}