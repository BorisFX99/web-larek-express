import { Router } from  'express';
import { validateCreateProduct, validateDeleteProduct, validateUpdateProduct } from '../middlewares/validators/productValidators';
import { getProductList, createProduct, updateProduct, deleteProduct, getProduct} from '../controllers/product';
import { validateObjectId } from '../middlewares/validators/commonValidators';

const router = Router();

router.post('/',validateCreateProduct, createProduct);
router.get('/', getProductList);
router.get('/', getProduct);
router.patch('/:productId',validateObjectId('productId','product'), validateUpdateProduct, updateProduct);
router.delete('/:productId',validateObjectId('productId','product'), validateDeleteProduct, deleteProduct);

export default router;