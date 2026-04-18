import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { ORIGIN_ALLOW, PORT, DB_ADDRESS } from './utils/constants';
import { errorHandler } from './middlewares/error-handler';
import { initDirectories } from './middlewares/file-upload';

import productRouter from './routes/product';
import authRouter from './routes/auth';
import uploadFileRouter from './routes/upload-file';

const app = express();

app.use(cookieParser());
app.use(cors({
  origin: ORIGIN_ALLOW,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Роуты
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/upload', uploadFileRouter);

// Статические файлы
app.use('/images', express.static(path.join(process.cwd(), 'src', 'public', 'images')));
app.use('/temp', express.static(path.join(process.cwd(), 'src', 'public', 'temp')));

app.use(errorHandler);

const startServer = async () => {
  await initDirectories();
  await mongoose.connect(DB_ADDRESS);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});

