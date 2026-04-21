import {
  model, Schema, Model,
} from 'mongoose';
import path from 'path';
import fs from 'fs/promises';
import { imageSchema, TImage } from './file';
import * as Errors from '../errors';
import { FILE_PATHS } from '../utils/constants';

export const CATEGORIES = ['софт-скил', 'хард-скил', 'другое', 'дополнительное', 'кнопка'] as const;
type TCategory = typeof CATEGORIES[number];

export interface IProduct {
    title: string;
    price: number | null;
    description: string;
    category: TCategory;
    image:TImage;
    __v?:number;
}

declare module 'mongoose' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Query<ResultType, DocType, THelpers = {}> {
    deletedDocument?: IProduct;
  }
}

type TitleCheckQuery = {
  title: string;
  _id?: {
    $ne: string;
  };
};

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
    unique: true,
  },
  image: {
    type: imageSchema,
    required: true,
  },
  price: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
  },

});

interface ProductModel extends Model<IProduct> {
  processImageFile(image: { fileName: string; originalName: string }): Promise<{
    tempPath: string;
    finalPath: string;
    finalFilename: string;
    imageData: TImage;
  }>;
  deleteOldImage(oldFileName: string): Promise<void>;
  checkUniqueTitle(title: string, excludeId?: string): Promise<boolean>;
}

// Хук для постобработки удаления файла после удаления продукта
productSchema.pre('findOneAndDelete', async function (next) {
  // Сохраняем документ в контексте
  const doc = await this.model.findOne(this.getFilter());
  this.deletedDocument = doc;
  next();
});

productSchema.post('findOneAndDelete', async function () {
  const doc = this.deletedDocument;
  console.log('хук послде удаления вызвался !');
  if (doc?.image?.fileName) {
    try {
      const oldFileBaseName = path.basename(doc.image.fileName);
      const filePath = path.join(FILE_PATHS.imagesDir, oldFileBaseName);
      await fs.unlink(filePath);
    } catch (err) {
      console.log(err);
    }
  } else {
    console.log('Файл не существует или уже был удален');
  }
});

// Статический метод для обработки файла изображения
productSchema.statics.processImageFile = async function (image: {
  fileName: string;
  originalName: string
}) {
  const fileName = path.basename(image.fileName); // "686ade58.png"
  const tempPath = path.join(FILE_PATHS.tempDir, fileName); // "public/temp/686ade58.png"
  const finalPath = path.join(FILE_PATHS.imagesDir, fileName); // "public/images/686ade58.png"

  // Проверяем существование временного файла
  try {
    await fs.access(tempPath);
  } catch {
    throw new Errors.BadRequestError(`Временный файл ${image.fileName} не найден`);
  }
  return {
    tempPath,
    finalPath,
    fileName,
    imageData: {
      fileName: `/images/${fileName}`,
      originalName: image.originalName,
    },
  };
};

// Статический метод для удаления заменного (старого) файла после обновления
productSchema.statics.deleteOldImage = async function (oldFileName: string) {
  const oldFilePath = path.join(FILE_PATHS.imagesDir, oldFileName);
  try {
    await fs.access(oldFilePath);// проверка есть ли че то в /images
    await fs.unlink(oldFilePath); // удаляет из /images
  } catch {
    console.log('Замененный файл не существует или уже был удален');
  }
};

// Статический метод для проверки уникальности title
productSchema.statics.checkUniqueTitle = async function (
  title: string,
  excludeId?:string,
) {
  const query: TitleCheckQuery = { title };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await this.findOne(query);
  return !existing; // true - уникальный, false - не уникальный
};

export default model<IProduct, ProductModel>('Product', productSchema);
