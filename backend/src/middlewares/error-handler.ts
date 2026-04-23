import { Request, Response, NextFunction } from 'express';
import parseError from '../utils/error-parser';

// Формируем ответ с success: false
type TErrorResponse = {
    success: boolean;
    message: string;
    statusCode: number;
    details?: unknown; // добавляем optional
  }

const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const appError = parseError(error);
  // Формируем ответ с success: false
  const errorResponse:TErrorResponse = {
    success: false,
    message: appError.message,
    statusCode: appError.statusCode,
  };
  // Добавляем details, если есть
  if (appError.details) {
    errorResponse.details = appError.details;
  }
  return res.status(appError.statusCode).json(errorResponse);
};
export default errorHandler;
