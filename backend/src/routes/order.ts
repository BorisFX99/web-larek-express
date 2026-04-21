import express from 'express';
import { validateCreateOrder } from '../middlewares/validators/orderValidators';
import { createOrder } from '../controllers/order';

const router = express.Router();

// POST /order
router.post('/', validateCreateOrder, createOrder);

export default router;