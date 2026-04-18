import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import * as Errors from '../errors'
import fs from 'fs/promises';

const ROOT_DIR = process.cwd(); // backend/
const PUBLIC_DIR = path.join(ROOT_DIR, 'src', 'public'); // backend/src/public
const tempDir = path.join(PUBLIC_DIR, 'temp');

export const initDirectories = async () => {
  const directories = [
    path.join(PUBLIC_DIR, 'temp'),
    path.join(PUBLIC_DIR, 'images'),
  ]
  for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Ошибка при создании ${dir}:`, error);
        throw error;
      }
    }
}

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Errors.BadRequestError('Только формат изображения (jpeg, jpg, png, gif, svg)'));
  }
};

const upload = multer({
  dest: tempDir,  // временное хранилище
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB
  },
  fileFilter: fileFilter
});

export default upload;