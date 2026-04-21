import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from 'middlewares/auth-middleware';
import * as Errors from '../errors';
import User from '../models/user';

// POST /auth/register - создание
export const createUser = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { name, password, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new Errors.ConflictError('Пользователь с таким email уже существует'));
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });
    const { accessToken, refreshToken } = User.generateTokens(user._id);
    user.setRefreshCookie(res, refreshToken);
    // Хешируем refreshToken перед сохранением в бд
    await user.addRefreshToken(refreshToken);
    await user.save();
    res.status(201).json({
      success: true,
      accessToken,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login — аутентификация пользователя
export const loginUser = async (req: Request, res: Response, next:NextFunction) => {
  const { email, password } = req.body;
  try {
    const user = await User.findUserByCredentials(email, password);
    const { accessToken, refreshToken } = User.generateTokens(user._id);
    // Устанавливаем cookie
    user.setRefreshCookie(res, refreshToken);
    // Хешируем новый refreshToken перед сохранением в БД
    await user.addRefreshToken(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(new Errors.UnauthorizedError('Неправильные почта или пароль'));
  }
};

// GET /auth/user — выпуск новой пары access- и refresh-токенов, получает httpOnly-куку c именем refreshToken
export const getUserTokens = async (req: Request, res: Response, next:NextFunction) => {
  try {
    // 1. Берём refreshToken из httpOnly куки
    const oldRefreshToken = req.cookies.refreshToken;

    if (!oldRefreshToken) {
      return next(new Errors.UnauthorizedError('Refresh token не найден'));
    }
    // Верификация JWT и ищем пользователя по id из payload токена
    const user = await User.findByRefreshToken(oldRefreshToken);
    if (!user) {
      return next(new Errors.UnauthorizedError('Пользователь/токен не найден'));
    }
    // Генерируем новую пару токенов
    const { accessToken, refreshToken: newRefreshToken } = User.generateTokens(user._id);

    // Ищем токен в массиве пользователя, Формируем новый массив токенов без старого в базе
    // и удаляем использованный токен из базы, добавляем новый
    const rotatedTokens = await user.rotateRefreshToken(oldRefreshToken, newRefreshToken);
    if (!rotatedTokens) {
      return next(new Errors.UnauthorizedError('Refresh token не найден в БД'));
    }
    await user.save();

    // Устанавливаем новый refreshToken в httpOnly куку
    user.setRefreshCookie(res, newRefreshToken);
    //  Возвращаем новый accessToken
    res
      .status(200)
      .json({
        success: true,
        accessToken,
        user: {
          email: user.email,
          name: user.name,
        },
      });
  } catch (err) {
    next(new Errors.UnauthorizedError('Ошибка при обновлении токенов'));
  }
};

// GET /auth/logout — выход пользователя
export const logoutUser = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    // Если есть refreshToken, пытаемся его удалить из БД
    if (refreshToken) {
      const user = await User.findByRefreshToken(refreshToken);
      if (user) {
        await user.removeRefreshToken(refreshToken);
        await user.save();
      }
    }
    // Очищаем cookie независимо от результата удаления из базы refresh
    User.clearRefreshCookie(res);

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    // Даже при ошибке очищаем cookie
    User.clearRefreshCookie(res);
    return next(err);
  }
};

// GET /auth/user - получение информации о текущем пользователе
export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // req.user уже добавлен мидлварой и содержит _id, тип добавил
    const userId = req.user?._id;

    if (!userId) {
      return next(new Errors.UnauthorizedError('Пользователь не авторизован'));
    }

    const user = await User.findById(userId).select('name email');

    if (!user) {
      return next(new Errors.UnauthorizedError('Пользователь не найден'));
    }

    res.status(200).json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    next(new Errors.UnauthorizedError('Ошибка получения пользователя'));
  }
};
