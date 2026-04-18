import { Router } from  'express';
import { createUser, loginUser, getUserTokens, logoutUser, getUser} from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth-middleware';
import { validateCreateUser, validateLoginUser } from '../middlewares/validators/userValidators';

const router = Router();

router.post('/register',validateCreateUser, createUser);
router.post('/login',validateLoginUser, loginUser);
router.get('/token', getUserTokens);
router.get('/user',authMiddleware, getUser);
router.get('/logout', logoutUser);

export default router;
