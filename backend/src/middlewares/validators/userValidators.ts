import { celebrate, Joi, Segments } from 'celebrate';

// Схема для логина
const userLoginSchema = {
  email: Joi.string().email().required(),
  password: Joi.string().required(),
};

// Схема для тела продукта (переиспользуемая)
const userRegisterSchema = {
  name: Joi.string().min(2).max(30).default('Ё-мое'),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
};

// POST /auth/register - создание
export const validateCreateUser = celebrate({
  [Segments.BODY]: Joi.object({
    ...userRegisterSchema,
  }),
});

// POST /auth/login - логин
export const validateLoginUser = celebrate({
  [Segments.BODY]: Joi.object({
    ...userLoginSchema,
  }),
});
