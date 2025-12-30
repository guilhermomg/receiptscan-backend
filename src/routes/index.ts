import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth);
router.use('/auth', authRoutes);

export default router;
