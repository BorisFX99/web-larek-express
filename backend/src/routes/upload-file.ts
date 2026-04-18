import express from 'express';
import fileMiddleware from '../middlewares/file-upload';
import { uploadTempFile } from '../controllers/upload-file';

const router = express.Router();

// POST /upload - загрузка файла только во временную папку
router.post('/', fileMiddleware.single('file'), uploadTempFile);

export default router;