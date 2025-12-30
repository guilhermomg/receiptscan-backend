import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import authRoutes from './auth.routes';
import uploadRoutes from './upload.routes';
import receiptRoutes from './receipt.routes';
import billingRoutes from './billing.routes';
import docsRoutes from './docs.routes';

const router = Router();
const healthController = new HealthController();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Returns the health status of the API with environment information
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 123.456
 *                 environment:
 *                   type: string
 *                   example: dev
 *                   description: Current deployment environment (dev/test/prd)
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 deployment:
 *                   type: object
 *                   properties:
 *                     commitSha:
 *                       type: string
 *                       example: abc123def456
 *                     deployedAt:
 *                       type: string
 *                       format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     firebase:
 *                       type: string
 *                       example: configured
 *                     openai:
 *                       type: string
 *                       example: configured
 *                     stripe:
 *                       type: string
 *                       example: configured
 */
router.get('/health', healthController.getHealth);
router.use('/docs', docsRoutes);
router.use('/auth', authRoutes);
router.use('/billing', billingRoutes);

// Both upload and CRUD routes are mounted on /receipts
// Upload routes: /upload, /file, /file-url, /parse (specific paths)
// CRUD routes: /, /:id, /stats (general paths)
// Routes are processed in order, so specific paths (upload) are checked first
router.use('/receipts', uploadRoutes);
router.use('/receipts', receiptRoutes);

export default router;
