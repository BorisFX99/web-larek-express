import { celebrate, Joi, Segments } from 'celebrate';
import { routerParamErrors, TRouterParamErrors } from '../../utils/constants';

// Проверяем динамический ключ id запроса на соответвие типу _id из базы
export const validateObjectId = (paramName: string = 'id', type?:keyof TRouterParamErrors) => {
  const message = type
    ? routerParamErrors[type]
    : 'Передан не валидный ID';

  return celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      [paramName]: Joi.string()
        .length(24)
        .hex()
        .required()
        .messages({
          'string.length': message,
          'string.hex': message,
          'any.required': message,
          'string.base': message
        })
    })
  });
};