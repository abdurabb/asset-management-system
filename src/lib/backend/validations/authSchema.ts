import Joi from "joi";

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
    "string.empty": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
    "string.empty": "Password is required",
  }),
});

export const refreshSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    "any.required": "Refresh token is required",
    "string.empty": "Refresh token is required",
  }),
});
