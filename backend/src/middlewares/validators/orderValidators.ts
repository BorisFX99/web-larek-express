import { celebrate, Joi, Segments} from 'celebrate';
import { PaymentType } from '../../models/order';

// Валидация заказа
export const validateCreateOrder = celebrate({
  [Segments.BODY]: Joi.object({
    payment: Joi.string()
      .valid(...Object.values(PaymentType))  // ['card', 'online']
      .required()
      .messages({
        'any.only': `Допустимый формат способа оплаты: ${Object.values(PaymentType).join(', ')}`,
        'any.required': '"Способ оплаты" обязательное поле'
      }),
    email:Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Невалидный формат почты',
        'any.required': '"Email" обязательное поле'
      }),
    phone: Joi.string()
      .min(5)
      .max(20)
      .required()
      .messages({
        'string.min': 'Номер телефона должен содержать минимум 5 цифр',
        'any.required': '"Номер телефона" обязательное поле'
      }),
    address: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Адрес должен содержать минимум 5 символов',
        'any.required': '"Адрес" обязательное поле'
      }),
    total: Joi.number()
      .positive()
      .required()
      .messages({
        'number.positive': 'Общее количество товаров не может быть меньше 0',
        'any.required': '"Total" обязательное поле'
      }),
    items: Joi.array()
    .items(
      Joi.string()
        .required()
        .length(24)
        .messages({
          'string.length': 'Передан невалидный id товара',
        })
    )
    .min(1)
    .required()
    .messages({
        'array.min': 'Для заказа не выбраны товары',
        'any.required': 'Items field is required'
      }),
  })
})
