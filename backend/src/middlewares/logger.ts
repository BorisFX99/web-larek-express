import path from 'path';
import { FILE_PATHS } from '../utils/constants';

// middlewares/logger.ts
const winston = require('winston');
const expressWinston = require('express-winston');

// логгер запросов
export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: path.join(FILE_PATHS.logDir, 'request.log') }),
  ],
  format: winston.format.json(),
});

// логгер ошибок
export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: path.join(FILE_PATHS.logDir, 'error.log') }),
  ],
  format: winston.format.json(),
});
