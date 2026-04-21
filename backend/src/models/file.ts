import { Schema } from 'mongoose';

export type TImage = {
  fileName: string;
  originalName: string
}

export const imageSchema = new Schema<TImage>({
  fileName: {
    type: String,
  },
  originalName: {
    type: String,
  },
});
