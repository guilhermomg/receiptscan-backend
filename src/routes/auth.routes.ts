import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// All auth routes require authentication
router.post('/register', authMiddleware, authController.register);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/profile', authMiddleware, authController.updateProfile);

export default router;
