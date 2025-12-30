import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth);
router.use('/auth', authRoutes);
router.use('/receipts', uploadRoutes);

export default router;
