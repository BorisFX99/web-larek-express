import mongoose from 'mongoose';

export interface IAppError extends Error {
  statusCode: number;
  details?: any; // опционально для деталей валидации
}

interface MongoErrorWithKeyPattern extends mongoose.mongo.MongoError {
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

// Вспомогательная функция для создания стандартизированной ошибки
const createError = (message: string, statusCode: number): IAppError => {
  const error = new Error(message) as IAppError;
  error.statusCode = statusCode;
  return error;
};

const parseError = (error:unknown): IAppError => {
  // 1. Уже есть statusCode беру из кастомных ошибок (классы)
  if (error instanceof Error && 'statusCode' in error && error.statusCode) {
    return error as IAppError;
  }

  // 2. Ошибка дубликата MongoDB
  if (error instanceof mongoose.mongo.MongoError && error.code === 11000) {
    const mongoError = error as MongoErrorWithKeyPattern;
    const field = Object.keys(mongoError.keyPattern || {})[0];
    const value = mongoError.keyValue?.[field];
    const dupError = createError('Такая запись уже существует', 409);
    dupError.details = {
      dupField: value,
    };
    return dupError;
  }

  // 3. Ошибка валидации Mongoose
  if (error instanceof mongoose.Error.ValidationError) {
    const validationError = createError('Ошибка валидации данных', 400);
    validationError.details = error.errors;
    return validationError;
  }

  // 4. Ошибка Cast (неверный ID)
  if (error instanceof mongoose.Error.CastError) {
    return createError(`Неверный формат идентификатора: ${error.value}`, 400);
  }

  // 5. Обычная ошибка
  if (error instanceof Error) {
    return createError(error.message, 500);
  }

  // 6. Неизвестная ошибка
  return createError('Внутренняя ошибка сервера', 500);
};

export default parseError;
