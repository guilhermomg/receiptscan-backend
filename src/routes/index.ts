import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';
import receiptRoutes from './receipt.routes';

const router = Router();
const healthController = new HealthController();

router.get('/health', healthController.getHealth);
router.use('/auth', authRoutes);

// Both upload and CRUD routes are mounted on /receipts
// Upload routes: /upload, /file, /file-url, /parse (specific paths)
// CRUD routes: /, /:id, /stats (general paths)
// Routes are processed in order, so specific paths (upload) are checked first
router.use('/receipts', uploadRoutes);
router.use('/receipts', receiptRoutes);

export default router;
