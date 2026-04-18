import { celebrate, Joi, Segments } from 'celebrate';

// Проверяем динамический ключ id запроса на соответвие типу _id из базы
export const validateObjectId = (paramName: string = 'id') => celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    [paramName]: Joi.string().length(24).hex().required()
  })
});