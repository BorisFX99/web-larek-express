import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs/promises';
import * as Errors from '../errors';
import { FILE_PATHS } from '../utils/constants';

// Метод создания директория хранения файлов /temp и /images и logs/
export const initDirectories = async () => {
  const directories = [
    FILE_PATHS.tempDir,
    FILE_PATHS.imagesDir,
    FILE_PATHS.logDir,
  ];

  try {
    await Promise.all(directories.map((dir) => fs.mkdir(dir, { recursive: true })));
  } catch (error) {
    console.error('Ошибка при создании директорий:', error);
    throw error;
  }
};

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, FILE_PATHS.tempDir);
  },
  filename(_req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname); // '.jpg'
    cb(null, `${uniqueName}${ext}`);
  },
});
// Фильтрация файлов (только изображения)
const fileFilter = (
  _req: Request,
  // eslint-disable-next-line no-undef -- не импортриутся тип File из multer. А так все работает
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg\+xml|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Errors.BadRequestError('Только формат изображения (jpeg, jpg, png, gif, svg)'));
  }
};

const upload = multer({
  storage, // временное хранилище
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

export default upload;
