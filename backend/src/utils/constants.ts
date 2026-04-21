import dotenv from 'dotenv';

import path from 'path';

dotenv.config();

// env config
export const PORT = process.env.PORT || 3000;
export const DB_ADDRESS = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'images';
export const UPLOAD_PATH_TEMP = process.env.UPLOAD_PATH_TEMP || 'temp';
export const ORIGIN_ALLOW = process.env.ORIGIN_ALLOW || 'http://localhost:5173';
export const AUTH_REFRESH_TOKEN_EXPIRY = process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d';
export const AUTH_ACCESS_TOKEN_EXPIRY = process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m';
// безопасность прям аж ващееее :)
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';

// Обозначаю константы путей для файлов
const rootDir = process.cwd(); // /backend
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
export const FILE_PATHS = {
  PUBLIC_DIR,
  imagesDir: path.join(PUBLIC_DIR, 'images'),
  tempDir: path.join(PUBLIC_DIR, 'temp'),
  logDir: path.join(rootDir, 'src', 'logs'),
} as const;

// Задаем порог в 24 часа (миллисекунды) для очистки public/temp файлов используем Crone
export const TEMP_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// Константы для обработки ошибки валидации celebrate params id
export const routerParamErrors = {
  product: 'Передан не валидный ID товара',
} as const;

export type TRouterParamErrors = typeof routerParamErrors;
