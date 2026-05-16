import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { updateProfileValidator, changePasswordValidator } from '../validators/user.validator';
import { protect } from '../middleware/auth';

const router = Router();

// All user routes require a valid JWT
router.use(protect);

router.get   ('/profile',         userController.getProfile);
router.put   ('/profile',         updateProfileValidator, userController.updateProfile);
router.put   ('/change-password', changePasswordValidator, userController.changePassword);
router.delete('/account',         userController.deleteAccount);

export default router;
