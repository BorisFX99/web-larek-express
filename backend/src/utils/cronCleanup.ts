import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { FILE_PATHS, TEMP_EXPIRATION_TIME } from './constants';

// Основная функция очистки: удаляет все файлы из папки temp,
// время создания которых (ctime) превышает 24 часа.
const cleanTempFolder = async () => {
  try {
    const items = await fs.readdir(FILE_PATHS.tempDir);
    const now = Date.now();

    for (const file of items) {
      const filePath = path.join(FILE_PATHS.tempDir, file);
      try {
        const stat = await fs.stat(filePath);
        const fileAge = now - stat.ctimeMs;

        if (fileAge > TEMP_EXPIRATION_TIME) {
          await fs.unlink(filePath);
        }
      } catch (err) {
        console.error(` Ошибка при обработке файла ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Не удалось прочитать папку temp:`, err);
  }
};

// Запускает планировщик очистки каждый день в 00:00.
const startTempCleanupScheduler = () => {
  // Cron-выражение "0 0 * * *" означает "каждый день в полночь" [citation:10]
  cron.schedule('0 0 * * *', () => {
    cleanTempFolder();
  });
};

export default startTempCleanupScheduler;
