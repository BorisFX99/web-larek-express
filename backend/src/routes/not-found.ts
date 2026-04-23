import express from 'express';
import notFound from '../controllers/not-found';

const router = express.Router();

// not-found 404 request
router.all('*', notFound);

export default router;
