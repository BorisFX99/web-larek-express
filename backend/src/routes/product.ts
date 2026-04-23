import { Router } from 'express';
import { validateCreateProduct, validateDeleteProduct, validateUpdateProduct } from '../middlewares/validators/productValidators';
import {
  getProductList, createProduct, updateProduct, deleteProduct, getProduct,
} from '../controllers/product';
import validateObjectId from '../middlewares/validators/commonValidators';

const router = Router();

router.post('/', validateCreateProduct, createProduct);
router.get('/', getProductList);
router.get('/:productId', validateObjectId('product', 'productId'), getProduct);
router.patch('/:productId', validateObjectId('product', 'productId'), validateUpdateProduct, updateProduct);
router.delete('/:productId', validateObjectId('product', 'productId'), validateDeleteProduct, deleteProduct);

export default router;
