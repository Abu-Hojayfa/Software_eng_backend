import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { signupValidator, loginValidator } from '../validators/auth.validator';
import { signupLimiter, loginLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/signup',  signupLimiter, signupValidator, authController.signup);
router.post('/login',   loginLimiter,  loginValidator,  authController.login);
router.post('/logout',  protect,                        authController.logout);
router.post('/refresh',                                  authController.refresh);
router.get ('/me',      protect,                        authController.me);

export default router;
