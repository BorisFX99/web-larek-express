import { celebrate, Joi, Segments} from 'celebrate';
import { CATEGORIES } from '../../models/product';

// Схема для тела продукта (переиспользуемая)
const productBodySchema = {
  title: Joi.string().min(2).max(30),
  price: Joi.number().min(0).allow(null),
  description: Joi.string(),
  category: Joi.string().valid(...CATEGORIES),
  image: Joi.object().keys({
    fileName: Joi.string().required(),
    originalName: Joi.string().required()
  })
};

// POST /products - создание
export const validateCreateProduct = celebrate({
  [Segments.BODY]: Joi.object({
    ...productBodySchema,
    title: productBodySchema.title.required(),
    category: productBodySchema.category.required(),
    image: productBodySchema.image.required(),
    description: productBodySchema.description
  })
});

// PATCH /products - обновление
export const validateUpdateProduct = celebrate({
  [Segments.BODY]: Joi.object({
    title: productBodySchema.title,
    price: productBodySchema.price,
    description: productBodySchema.description,
    category: productBodySchema.category,
    image: productBodySchema.image  // без .required()
  })
});