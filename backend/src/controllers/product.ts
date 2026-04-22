import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import * as Errors from '../errors';
import Product, { IProduct } from '../models/product';

export const createProduct = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { image, ...productInfo } = req.body;
    if (Object.keys(productInfo).length === 0 || !image) {
      return next(new Errors.BadRequestError('Неполные данные о товаре'));
    }
    // Обработка файла
    const { tempPath, finalPath, imageData } = await Product.processImageFile(image);

    // Сохраняем в бд
    const product = await Product.create({
      ...productInfo,
      image: imageData,
    });
    // Исключаем поле __v
    const { __v, ...productOnly } = product.toObject();
    // Копируем файл и удаляем временный файл
    await fs.copyFile(tempPath, finalPath);
    await fs.unlink(tempPath);
    // 6. Отвечаем клиенту
    return res.status(201).json(productOnly);
  } catch (error) {
    return next(error);
  }
};

export const getProductList = async (_req: Request, res: Response, next:NextFunction) => {
  try {
    const products = await Product.find({});
    return res.status(200).send({
      items: products,
      total: products.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const productId = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return next(new Errors.NotFoundError('Товар по id не найден'));
    }
    return res.status(200).json(product);
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { productId } = req.params;
    const { image, ...productInfo } = req.body;
    // Проверяем, есть ли хоть какие-то данные для обновления
    if (Object.keys(productInfo).length === 0 && !image) {
      return res.status(204).json({ message: 'Нет данных для обновления' }); // No Content
    }
    // Проверяем есть ли товар с перданным id
    const existingProduct:IProduct | null = await Product.findById(productId);
    if (!existingProduct) {
      return next(new Errors.NotFoundError(`Товар не найден по id: ${productId}`));
    }
    const updateData: Partial<IProduct> = { ...productInfo };

    // Проверяем есть ли уже товар с таким именем в базе (исключая текущий)
    if (updateData.title) {
      const isDuplicateProductTitle = await Product.checkUniqueTitle(updateData.title, productId);
      if (!isDuplicateProductTitle) {
        return next(new Errors.ConflictError('Товар с таким заголовком уже существует'));
      }
    }
    // Если передан новый файл
    if (image) {
      // парсим файл
      const { tempPath, finalPath, imageData } = await Product.processImageFile(image);
      updateData.image = imageData;

      // сначала обновляем в БД
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        updateData,
        {
          new: true,
          runValidators: true,
          select: '-__v -_id',
          lean: true,
        },
      );
      if (!updatedProduct) {
        return next(new Errors.NotFoundError('Товар не найден'));
      }
      // Перемещаем файл из temp в постоянное хранилище
      await fs.rename(tempPath, finalPath);
      // Удаляем старый файл (если он был)
      if (existingProduct.image?.fileName) {
        const oldFileBaseName = path.basename(existingProduct.image.fileName);
        await Product.deleteOldImage(oldFileBaseName);
      }
      // Ответ клиенту
      return res.status(200).json(updatedProduct);
    }
    // Если файл не обновляется, просто обновляем данные в БД
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      {
        new: true,
        runValidators: true,
        select: '-__v -_id',
        lean: true,
      },
    );
    if (!updatedProduct) {
      return next(new Errors.NotFoundError('Товар не найден'));
    }
    return res.json(updatedProduct);
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { productId } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return next(new Errors.NotFoundError('Товар не найден'));
    }
    // Исключаем поле __v
    const { __v, ...productOnly } = deletedProduct.toObject();
    return res.status(200).json(productOnly);
  } catch (error) {
    return next(error);
  }
};
