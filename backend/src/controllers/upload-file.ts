
import { Request, Response, NextFunction } from 'express';
import * as Errors from '../errors';

export const uploadTempFile = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Multer уже сохранил файл в temp/ но проверем все равно
    if (!req.file) {
      return next(new Errors.BadRequestError('Файл не загружен'));
    }
    const finalFileName = req.file.filename; // "686ade58.png"
    // Возвращаем информацию о временном файле
    res.json({
      fileName: `/images/${finalFileName}`,  // пример:"/images/686ade58.png"
      originalName: req.file.originalname,
    });

  } catch (error) {
    console.error('Original error:', error); // Логируем оригинал на всякий случай
    next(new Error('Ошибка при загрузке файла'));
  }
};
