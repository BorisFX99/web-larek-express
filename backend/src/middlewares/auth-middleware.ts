import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../utils/constants';
import * as Errors from '../errors';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  // Берем accessToken из заголовка Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new Errors.UnauthorizedError('Access token не предоставлен'));
  }

  const accessToken = authHeader.split(' ')[1];

  if (!accessToken) {
    return next(new Errors.UnauthorizedError('Access token не найден'));
  }

  try {
    // Верифицируем accessToken
    const payload = jwt.verify(accessToken, JWT_ACCESS_SECRET) as { _id: string };

    // Добавляем user в req для дальнейшего использования
    req.user = payload;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new Errors.UnauthorizedError('Access token истек'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new Errors.UnauthorizedError('Невалидный access token'));
    }
    return next(new Errors.UnauthorizedError('Ошибка авторизации'));
  }
};
