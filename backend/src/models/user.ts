import { Response } from 'express';
import {
  model, Model, Types, Schema, Document,
} from 'mongoose';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import ms from 'ms';
import bcrypt from 'bcryptjs';
import type { StringValue } from 'ms';
import {
  AUTH_ACCESS_TOKEN_EXPIRY,
  AUTH_REFRESH_TOKEN_EXPIRY,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
} from '../utils/constants';

type token = {
   token: string;
}

export type TUser = {
  name?: string;
  email: string;
  password: string;
  tokens: token [];
}

export const userSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
    default: 'Ё-мое',
  },
  email: {
    type: String,
    validate: {
      validator: (v: string) => validator.isEmail(v),
      message: 'Неправильный формат почты',
    },
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minlength: 6,
    required: true,
    select: false,
  },
  tokens: {
    type: [{
      token: { type: String, required: true },
    }],
    select: false,
    default: [],
  },
});

const access_expiry: StringValue = AUTH_ACCESS_TOKEN_EXPIRY as StringValue;
const refresh_expiry: StringValue = AUTH_REFRESH_TOKEN_EXPIRY as StringValue;

  // Расширяем TUser методами документа типизация
  interface IUserDocument extends TUser, Document {
    setRefreshCookie: (res: Response, refreshToken: string) => void;
    removeRefreshToken: (refreshToken: string) => Promise<boolean>;
    hasRefreshToken: (refreshToken: string) => Promise<boolean>;
    addRefreshToken: (refreshToken: string, maxTokens?: number) => Promise<void>;
    rotateRefreshToken: (oldRefreshToken: string, newRefreshToken: string) => Promise<boolean>;
}

  // Расширяем UserModel методами класса
  interface UserModel extends Model<IUserDocument, Document> {
    generateTokens: (userId: Types.ObjectId) => { accessToken: string; refreshToken: string };
    findUserByCredentials: (email: string, password: string) => Promise<IUserDocument>;
    findByRefreshToken: (refreshToken: string) => Promise<IUserDocument | null>;
    clearRefreshCookie: (res: Response) => void;
}

// Статический метод для генерации токенов
userSchema.statics.generateTokens = function (userId: Types.ObjectId) {
  const accessToken = jwt.sign(
    { _id: userId },
    JWT_ACCESS_SECRET,
    { expiresIn: access_expiry },
  );

  const refreshToken = jwt.sign(
    { _id: userId },
    JWT_REFRESH_SECRET,
    { expiresIn: refresh_expiry },
  );

  return { accessToken, refreshToken };
};

// Статический метод идентификации пользователя при логине
userSchema.statics.findUserByCredentials = function (email: string, password: string) {
  return this.findOne({ email }).select('+password +tokens').then((user: IUserDocument | null) => {
    if (!user) {
      throw new Error('Неправильные почта или пароль');
    }
    return bcrypt.compare(password, user.password).then((matched) => {
      if (!matched) {
        throw new Error('Неправильные почта или пароль');
      }
      return user;
    });
  });
};

// 5. Статический метод: поиск пользователя по refreshToken
userSchema.statics.findByRefreshToken = function (refreshToken: string): Promise<IUserDocument | null> {
  return (async () => {
    try {
      // Верифицируем токен
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { _id: string };

      // Ищем пользователя
      const user = await this.findById(payload._id).select('+tokens');

      // Проверяем, есть ли юзер и токен у пользователя в базе
      if (user && await user.hasRefreshToken(refreshToken)) {
        return user;
      }
      return null;
    } catch (err) {
      return null;
    }
  })();
};

// Статический метод: очистка cookie (для logout)
userSchema.statics.clearRefreshCookie = function (res: Response) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  });
};

// Метод документа для установки куки
userSchema.methods.setRefreshCookie = function (res: Response, refreshToken: string) {
  const maxAgeMs = ms(refresh_expiry);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: maxAgeMs,
    path: '/',
  });
};

// Метод документа: удаление refreshToken
userSchema.methods.removeRefreshToken = function (refreshToken: string): Promise<boolean> {
  return (async () => {
    let tokenRemoved = false;
    const filteredTokens = [];

    for (const tokenObj of this.tokens) {
      const isMatch = await bcrypt.compare(refreshToken, tokenObj.token);
      if (!isMatch) {
        filteredTokens.push(tokenObj);
      } else {
        tokenRemoved = true;
      }
    }

    this.tokens = filteredTokens;
    return tokenRemoved;
  })();
};

userSchema.methods.hasRefreshToken = function (refreshToken: string): Promise<boolean> {
  return (async () => {
    for (const tokenObj of this.tokens) {
      if (await bcrypt.compare(refreshToken, tokenObj.token)) {
        return true;
      }
    }
    return false;
  })();
};

//  Метод документа: добавление нового refreshToken
userSchema.methods.addRefreshToken = function (refreshToken: string): Promise<void> {
  return (async () => {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    this.tokens.push({ token: hashedToken });
  })();
};

// Метод документа: ротация токена (удалить старый, добавить новый)
userSchema.methods.rotateRefreshToken = function (oldRefreshToken: string, newRefreshToken: string): Promise<boolean> {
  return (async () => {
    const removed = await this.removeRefreshToken(oldRefreshToken);
    if (removed) {
      await this.addRefreshToken(newRefreshToken);
    }
    return removed;
  })();
};

export default model<IUserDocument, UserModel>('User', userSchema);
