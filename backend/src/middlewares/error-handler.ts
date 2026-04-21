import mongoose, { Error as MongooseError } from 'mongoose';
import { Request, Response, NextFunction } from 'express';

interface ErrorHandler extends Error {
  statusCode?: number;
  code?: number;
}

interface MongoErrorWithKeyPattern extends mongoose.mongo.MongoError {
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

const errorHandler = (
  error:ErrorHandler,
  _req: Request,
  res: Response,
  _next:NextFunction,
) => {
  // 1. Проверяем дубликат MongoDB
  if (error instanceof mongoose.mongo.MongoError && error.code === 11000) {
    const mongoError = error as MongoErrorWithKeyPattern;
    const field = Object.keys(mongoError.keyPattern || {})[0];
    const value = mongoError.keyValue?.[field];
    return res.status(409).json({
      success: false,
      message: 'Такая запись уже существует ',
      statusCode: 409,
      field: {
        dupKey: value,
      },
    });
  }

  // 2. Проверяем наши кастомные ошибки (у них есть statusCode)
  if (error.statusCode && error instanceof Error) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // 3. Проверяем ошибки валидации Mongoose
  if (error instanceof MongooseError.ValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      statusCode: 400,
      details: error.errors,
    });
  }

  // 4. Проверяем ошибку каста (неверный ID)
  if (error instanceof MongooseError.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Неверный формат идентификатора',
      statusCode: 400,
    });
  }

  // 5. ВСЁ ОСТАЛЬНОЕ - 500 (системная ошибка)
  console.error('Unhandled error:', error); // Логируем для отладки

  return res.status(500).json({
    success: false,
    message: error.message || 'Внутренняя ошибка сервера',
    statusCode: 500,
  });
};

export default errorHandler;
