import {
  model, Schema,
} from 'mongoose';
import validator from 'validator';

export const payment = {
  card: 'card',
  online: 'online',
} as const;

export type TPaymentType = typeof payment [keyof typeof payment];

export interface IOrder {
  payment: TPaymentType;
  email: string;
  phone: string;
  address: string;
  total: number;
  items: string[];
}

const orderSchema = new Schema<IOrder>({
  items: {
    type: [String],
    required: [true, 'Обязательное поле для заказа'],
    validate: {
      validator(items:string[]): boolean {
        // Проверка что массив не пустой
        if (!items || items.length === 0) {
          return false;
        }
        // Проверка что каждый элемент минимум 24 символа
        return items.every((item) => item.length === 24);
      },
      message: 'Id товара в заказе указано не верно',
    },
  },
  total: {
    type: Number,
    required: true,
    min: [1, 'Сумма заказа должна быть больше 0'], // ну по-любому же > 1
  },
  payment: {
    type: String,
    enum: Object.values(payment),
    required: true,
  },
  email: {
    type: String,
    validate: {
      validator: (v: string) => validator.isEmail(v),
      message: 'Неправильный формат почты',
    },
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

export default model<IOrder>('Order', orderSchema);
