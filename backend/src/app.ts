import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errors } from 'celebrate';
// Константы
import { FILE_PATHS } from './utils/constants';
import { ORIGIN_ALLOW, PORT, DB_ADDRESS } from './utils/constants';

// Мидлвары, кастомные методы
import { errorHandler } from './middlewares/error-handler';
import { initDirectories } from './middlewares/file-upload';
import { startTempCleanupScheduler } from './utils/cronCleanup';

// Роуты
import productRouter from './routes/product';
import authRouter from './routes/auth';
import uploadFileRouter from './routes/upload-file';
import orderRouter from './routes/order';

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

// Роуты без авторизации
app.use('/order', orderRouter);

// Роуты c авторизацией
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/upload', uploadFileRouter);

// Статические файлы
app.use(express.static(FILE_PATHS.PUBLIC_DIR));


// Ошибки обработчики
app.use(errors());  // обрабатывает ошибки валидации

app.use(errorHandler);// обрабатывает остальные ошибки валидации

const startServer = async () => {
  await initDirectories(); // директории создаем
  await mongoose.connect(DB_ADDRESS);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    startTempCleanupScheduler(); // очистка /temp раз в
  });
}

startServer().catch(err => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});
