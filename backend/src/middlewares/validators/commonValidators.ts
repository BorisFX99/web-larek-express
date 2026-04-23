import { celebrate, Joi, Segments } from 'celebrate';
import { routerParamErrors, TRouterParamErrors } from '../../utils/constants';

// Проверяем динамический ключ id запроса на соответвие типу _id из базы
const validateObjectId = (type?:keyof TRouterParamErrors, paramName: string = 'id') => {
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
          'string.base': message,
        }),
    }),
  });
};

export default validateObjectId;
