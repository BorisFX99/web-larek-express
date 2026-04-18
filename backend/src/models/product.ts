import { model, Schema } from 'mongoose';
import {imageSchema, TImage } from './file';

export const CATEGORIES = ["софт-скил", "хард-скил", "другое", "дополнительное", "кнопка"] as const;
type TCategory = typeof CATEGORIES[number];

interface IProduct {
    title: string;
    price: number | null;
    description: string;
    category: TCategory;
    image:TImage;
}

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
    unique: true
  },
  image: {
    type:imageSchema,
    required: true
  },
  price:{
    type: Number,
    default: null
  },
  description:{
    type: String
  },
  category:{
    type: String,
    enum: CATEGORIES,
    required: true
  },

});

export default model<IProduct>('Product', productSchema);