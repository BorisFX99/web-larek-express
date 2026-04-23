import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errors } from 'celebrate';
// Константы
import {
  FILE_PATHS, ORIGIN_ALLOW, PORT, DB_ADDRESS,
} from './utils/constants';

// Мидлвары, кастомные методы
import errorHandler from './middlewares/error-handler';
import startTempCleanupScheduler from './utils/cronCleanup';
import { initDirectories } from './middlewares/file-upload';

// Импортируем логгер Winston
import { requestLogger, errorLogger } from './middlewares/logger';

// Роуты
import productRouter from './routes/product';
import authRouter from './routes/auth';
import uploadFileRouter from './routes/upload-file';
import orderRouter from './routes/order';
import notFoundRouter from './routes/not-found';

const app = express();

app.use(cookieParser());
app.use(cors({
  origin: ORIGIN_ALLOW,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(requestLogger);

// Роуты без авторизации
app.use('/order', orderRouter);

// Роуты c авторизацией
app.use('/auth', authRouter);
app.use('/product', productRouter);
app.use('/upload', uploadFileRouter);

// Статические файлы
app.use(express.static(FILE_PATHS.PUBLIC_DIR));

// not-found
app.use('*', notFoundRouter);

// Логгер ошибок (до обработчиков ошибок)
app.use(errorLogger);

// Ошибки обработчики
app.use(errors()); // обрабатывает ошибки валидации celebrate
app.use(errorHandler);// обрабатывает остальные ошибки (404, 500, кастомные и.т.д)

const startServer = async () => {
  await initDirectories(); // директории создаем
  await mongoose.connect(DB_ADDRESS);
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    startTempCleanupScheduler(); // очистка /temp раз в
  });
};

startServer().catch((err) => {
  console.error('Ошибка запуска:', err);
  process.exit(1);
});
