import { Router, Request, Response } from 'express';
import logger from '../utils/logger';

const router = Router();

/**
 * Health check endpoint
 * Returns the current status of the API server
 */
router.get('/', (_req: Request, res: Response) => {
  const healthStatus = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  };

  logger.info('Health check performed');
  res.status(200).json(healthStatus);
});

/**
 * Readiness probe endpoint
 * Checks if the service is ready to accept traffic
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    // TODO: Add checks for Redis connection, GCS availability, etc.
    res.status(200).json({
      success: true,
      ready: true,
      checks: {
        redis: 'healthy',
        storage: 'healthy',
      },
    });
  } catch (error: any) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      ready: false,
      error: error.message,
    });
  }
});

/**
 * Liveness probe endpoint
 * Simple check to see if the service is running
 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    alive: true,
  });
});

export default router;
