import { Router } from  'express';
import { validateCreateProduct } from '../middlewares/validators/productValidators';
import { getProductList, createProduct} from '../controllers/product';

const router = Router();

router.post('/',validateCreateProduct, createProduct);
router.get('/', getProductList);
// router.get('/product/:id', getProductById);
// router.patch('/product/:id', updateProduct);
// router.delete('/product/:id', deleteProduct);

export default router;