import {Request, Response, NextFunction } from 'express';
import * as Errors from '../errors';
import Product from '../models/product';
import path from 'path';
import fs from 'fs/promises';

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const imagesDir = path.join(PUBLIC_DIR, 'images');


export const createProduct = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const { image, ...productInfo } = req.body;
    if ( Object.keys(productInfo).length === 0 || !image) {
      return next(new Errors.BadRequestError('Неполные данные о товаре'))
    }

    // парсим имя файла из пути "/images/686ade58
    const uniqueName = path.basename(image.fileName); // "686ade58"
    const ext = path.extname(image.originalName); // ".png"
    const finalFilename = `${uniqueName}${ext}`; // "686ade58.png"
    // Обозначаем директорию временного хранилища
    const tempPath = path.join(PUBLIC_DIR, 'temp', uniqueName);
    const finalPath = path.join(imagesDir, finalFilename);
    // Проверяем, существует ли временный файл вообще
    try {
      await fs.access(tempPath);
    } catch {
        return next(new Errors.BadRequestError(`Временный файл ${image.fileName} не найден`));
    }

    // Сохраняем в бд
    const product = await Product.create({
      ...productInfo,
      image:{
        fileName: `/images/${finalFilename}`,
        originalName: image.originalName
      }
    });
    // Перемещаем файл из temp в постоянное хранилище
    await fs.rename(tempPath, finalPath);
    // 6. Отвечаем клиенту
    res.status(201).json({
      success: true,
      product
    });
  }
  catch (error) {
    next(error);
  }
}

// export const updateTask = async (req: Request, res: Response) => {
//     const task = tasks.find(task => task.id === Number(req.params.id));

//     res.set("Content-Type", "application/json");

//     if (!task) {
//         res.send({error: "Task not found"});
//         return;
//     }

//     if (!req.body.content) {
//         res.send({error: "Content is required"});
//         return
//     }

//     task.content = req.body.content;
//     res.send({message: "Successfully updated"});
// }

export const getProductList = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const products = await Product.find({});
    res.status(200).send({
      items: products,
      total: products.length
    });
  } catch (error) {
    next(error);  // передаем в errorHandler
  }
}
// export const getTaskById = async (req: Request, res: Response) => {
//     res.set("Content-Type", "application/json");

//     const task = tasks.find((task) => task.id === Number(req.params.id));

//     if (!task) {
//         res.send({error: "Task not found"});
//         return;
//     }

//     res.send({task});
// }

// export const deleteTask = async (req: Request, res: Response) => {
//     const index = tasks.findIndex(task => task.id === Number(req.params.id));

//     res.set("Content-Type", "application/json");

//     if (index === -1) {
//         res.send({error: "Task not found"});
//         return;
//     }

//     tasks.splice(index, 1);
//     res.send({message: "Successfully deleted"});
// }
