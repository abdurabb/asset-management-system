import Joi from "joi";

export const createOfficeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(20)
    .required(),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  city: Joi.string()
    .trim()
    .max(100)
    .allow("", null),

  country: Joi.string()
    .trim()
    .max(100)
    .allow("", null),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),
});


export const updateOfficeSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100),

  code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(20),

  address: Joi.string()
    .trim()
    .max(500)
    .allow("", null),

  city: Joi.string()
    .trim()
    .max(100)
    .allow("", null),

  country: Joi.string()
    .trim()
    .max(100)
    .allow("", null),

  phone: Joi.string()
    .trim()
    .max(30)
    .allow("", null),

  isActive: Joi.boolean(),
}).min(1);


export const officeIdSchema = Joi.object({
  id: Joi.string()
    .trim()
    .required(),
});


export const getOfficesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),

  search: Joi.string()
    .trim()
    .max(100)
    .allow(""),

  isActive: Joi.boolean(),
});