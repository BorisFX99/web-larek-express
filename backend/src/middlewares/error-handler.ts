import { Error as MongooseError } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { isCelebrateError } from 'celebrate';

interface ErrorHandler extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (
  error:ErrorHandler,
  req: Request,
  res: Response,
  next:NextFunction
) => {

  // Ошибка валдации запроса от celebrate
  if (isCelebrateError(error)) {
  return res.status(400).json({
    success: false,
    message: 'Ошибка валидации запроса',
    statusCode: 400
    // без errors, без details чтобы не показать где именно что не так. скрыть.
  });
}

  // 1. Проверяем дубликат MongoDB
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Такая запись уже существует',
      statusCode: 409
    });
  }

  // 2. Проверяем наши кастомные ошибки (у них есть statusCode)
  if (error.statusCode && error instanceof Error) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode
    });
  }

  // 3. Проверяем ошибки валидации Mongoose
  if (error instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      statusCode: 400,
      details: error.errors
    });
  }

  // 4. Проверяем ошибку каста (неверный ID)
  if (error instanceof MongooseError.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Неверный формат идентификатора',
      statusCode: 400
    });
  }

  // 5. ВСЁ ОСТАЛЬНОЕ - 500 (системная ошибка)
  console.error('Unhandled error:', error); // Логируем для отладки

  res.status(500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
    statusCode: 500
  });
};