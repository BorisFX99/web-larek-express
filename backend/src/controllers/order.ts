import { Request, Response, NextFunction } from 'express';
import * as Errors from '../errors';
import Order, { IOrder } from '../models/order';
import Product from '../models/product';

export const createOrder = async (req: Request, res: Response, next:NextFunction) => {
  try {
    const orderData:IOrder = req.body;
    if (Object.keys(orderData).length === 0) {
      return next(new Errors.BadRequestError('Переданы неполные данные о заказе'));
    }
    // Парсим ответ с базы
    const productItems = await Product.find({ _id: { $in: orderData.items } });
    const foundIds = productItems.map((p) => p._id.toString());// в строку _id с базы конвертируем

    // Проверка существования всех id товаров в базе
    const notFoundProduct = orderData.items.filter((id) => !foundIds.includes(id));
    if (notFoundProduct.length > 0) {
      const errMessage = `Не найдены товары: ${notFoundProduct.join(', ')}`;
      return next(new Errors.NotFoundError(errMessage));
    }
    // Проверка что цена всех товаров везде не null
    const productsWithNullPrice = productItems.filter((item) => item.price === null);
    if (productsWithNullPrice.length > 0) {
      const productIdWithNullPrice = productsWithNullPrice.map((item) => item._id);
      const errMessage = `"Выбраны товары без цены": ${productIdWithNullPrice.join(', ')}`;
      return next(new Errors.BadRequestError(errMessage));
    }
    // Проверка что total товаров точно равна посчитанному total из базы
    const dbTotal = productItems.reduce((acc, item) => acc + item.price!, 0);
    if (dbTotal !== Number(orderData.total)) {
      return next(new Errors.BadRequestError('Общая сумма заказа не соответствует заявленной в заказе'));
    }
    // Сохраняем в бд
    const order = await Order.create({
      ...orderData,
      total: Number(orderData.total),
    });
    res.status(201).json({
      total: order.total,
      id: order._id,
    });
  } catch (error) {
    next(error);
  }
};
