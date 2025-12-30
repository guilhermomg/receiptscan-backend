/// <reference path="../types/express.d.ts" />
import { Request } from 'express';
import { getFirestore } from '../config/firebase';
import logger from '../config/logger';

export enum AuditAction {
  // Receipt operations
  RECEIPT_CREATE = 'receipt.create',
  RECEIPT_UPDATE = 'receipt.update',
  RECEIPT_DELETE = 'receipt.delete',
  RECEIPT_EXPORT = 'receipt.export',

  // Billing operations
  BILLING_CHECKOUT_CREATE = 'billing.checkout.create',
  BILLING_PORTAL_CREATE = 'billing.portal.create',
  BILLING_SUBSCRIPTION_UPDATE = 'billing.subscription.update',

  // Authentication operations
  AUTH_REGISTER = 'auth.register',
  AUTH_PROFILE_UPDATE = 'auth.profile.update',
  AUTH_LOGIN = 'auth.login',
  AUTH_LOGOUT = 'auth.logout',

  // Security events
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SECURITY_INVALID_TOKEN = 'security.invalid_token',
  SECURITY_UNAUTHORIZED_ACCESS = 'security.unauthorized.access',
  SECURITY_IP_BLOCKED = 'security.ip.blocked',
}

export interface AuditLog {
  id?: string;
  timestamp: Date;
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  resource?: {
    type: string;
    id: string;
  };
  metadata?: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  private collectionName = 'auditLogs';

  /**
   * Log an audit event
   */
  async log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const db = getFirestore();
      const logEntry: AuditLog = {
        ...auditLog,
        timestamp: new Date(),
      };

      await db.collection(this.collectionName).add(logEntry);

      logger.info('Audit log created', {
        action: auditLog.action,
        userId: auditLog.userId,
        success: auditLog.success,
        requestId: auditLog.requestId,
      });
    } catch (error) {
      // Log to Winston if Firestore fails
      logger.error('Failed to create audit log', {
        error,
        action: auditLog.action,
        userId: auditLog.userId,
      });
    }
  }

  /**
   * Log from Express request context
   */
  async logFromRequest(
    req: Request,
    action: AuditAction,
    success: boolean,
    resource?: { type: string; id: string },
    metadata?: Record<string, unknown>,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      userId: req.user?.uid,
      userEmail: req.user?.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
      resource,
      metadata,
      success,
      errorMessage,
    });
  }

  /**
   * Query audit logs by user
   */
  async getLogsByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      logger.error('Failed to query audit logs', { error, userId });
      return [];
    }
  }

  /**
   * Query audit logs by action
   */
  async getLogsByAction(action: AuditAction, limit = 100): Promise<AuditLog[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('action', '==', action)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      logger.error('Failed to query audit logs', { error, action });
      return [];
    }
  }

  /**
   * Query security events (failed operations)
   */
  async getSecurityEvents(limit = 100): Promise<AuditLog[]> {
    try {
      const db = getFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('success', '==', false)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      logger.error('Failed to query security events', { error });
      return [];
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
