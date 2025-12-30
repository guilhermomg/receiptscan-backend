import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import config from '../config';
import { db } from '../config/firebase';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check Firestore connection
    const startTime = Date.now();
    await db.collection('_health').doc('check').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const firestoreLatency = Date.now() - startTime;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: config.nodeEnv,
        projectId: config.firebase.projectId,
        region: config.firebase.region,
        apiBaseUrl: config.api.baseUrl,
      },
      services: {
        firestore: {
          status: 'connected',
          latency: `${firestoreLatency}ms`,
        },
        storage: {
          status: 'configured',
          bucket: config.storage.bucket,
        },
      },
      features: {
        openaiConfigured: !!config.openai.apiKey,
        stripeConfigured: !!config.stripe.apiKey,
        monitoringEnabled: config.monitoring.enabled,
        logLevel: config.monitoring.logLevel,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        nodeEnv: config.nodeEnv,
        projectId: config.firebase.projectId,
      },
    });
  }
};

export const readinessCheck = async (req: Request, res: Response) => {
  try {
    // Basic readiness check
    const checks = {
      firebaseInitialized: true,
      configLoaded: !!config.firebase.projectId,
    };

    const isReady = Object.values(checks).every(check => check === true);

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        checks,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        checks,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
