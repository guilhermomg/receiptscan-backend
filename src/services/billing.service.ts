import Stripe from 'stripe';
import config from '../config';
import { getFirestore } from '../config/firebase';
import { SubscriptionTier, SubscriptionStatus, UserProfile } from '../models/user.model';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

/**
 * Extended Stripe Subscription type with period fields
 * Note: The Stripe SDK types don't include current_period_* fields in the TypeScript definitions,
 * but these fields are present in the actual API responses.
 */
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start?: number;
  current_period_end?: number;
}

/**
 * Extended Stripe Invoice type with subscription field
 * Note: The subscription field exists at runtime but may not be in all type definitions.
 */
interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string;
}

export class BillingService {
  private stripe: Stripe;
  private usersCollection = 'users';
  private readonly FREE_TIER_LIMIT = 10;

  constructor() {
    if (!config.stripe.secretKey) {
      logger.warn('Stripe secret key not configured. Billing features will be disabled.');
      this.stripe = {} as Stripe;
    } else {
      this.stripe = new Stripe(config.stripe.secretKey, {
        apiVersion: '2025-12-15.clover',
      });
    }
  }

  private getDb() {
    return getFirestore();
  }

  /**
   * Create a Stripe checkout session for Pro subscription
   */
  public async createCheckoutSession(userId: string, email: string): Promise<string> {
    try {
      if (!config.stripe.secretKey) {
        throw new AppError('Billing service is not configured', 503);
      }

      // Get or create Stripe customer
      const customerId = await this.getOrCreateStripeCustomer(userId, email);

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: config.stripe.proPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${config.frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontendUrl}/billing/canceled`,
        metadata: {
          userId,
        },
      });

      logger.info('Checkout session created', { userId, sessionId: session.id });

      return session.url || '';
    } catch (error) {
      logger.error('Error creating checkout session', { userId, error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create checkout session', 500);
    }
  }

  /**
   * Create a Stripe customer portal session
   */
  public async createPortalSession(userId: string): Promise<string> {
    try {
      if (!config.stripe.secretKey) {
        throw new AppError('Billing service is not configured', 503);
      }

      // Get user profile
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data();
      if (!userData?.stripeCustomerId) {
        throw new AppError('No Stripe customer found for this user', 400);
      }

      // Create portal session
      const session = await this.stripe.billingPortal.sessions.create({
        customer: userData.stripeCustomerId,
        return_url: `${config.frontendUrl}/billing`,
      });

      logger.info('Portal session created', { userId, sessionId: session.id });

      return session.url;
    } catch (error) {
      logger.error('Error creating portal session', { userId, error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create portal session', 500);
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  private async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    const userRef = this.getDb().collection(this.usersCollection).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new AppError('User not found', 404);
    }

    const userData = userDoc.data();

    // Return existing customer ID if available
    if (userData?.stripeCustomerId) {
      return userData.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    // Store customer ID in user profile
    await userRef.update({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    });

    logger.info('Stripe customer created', { userId, customerId: customer.id });

    return customer.id;
  }

  /**
   * Get current subscription for a user
   */
  public async getSubscription(userId: string): Promise<{
    tier: SubscriptionTier;
    status?: SubscriptionStatus;
    currentPeriodEnd?: Date;
    receiptUsageThisMonth: number;
    receiptLimit: number | null;
  }> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data() as UserProfile;

      // Handle Firestore Timestamp conversion
      const currentPeriodEnd = userData.currentPeriodEnd;
      const currentPeriodEndDate =
        currentPeriodEnd instanceof Date
          ? currentPeriodEnd
          : currentPeriodEnd && typeof currentPeriodEnd === 'object' && 'toDate' in currentPeriodEnd
            ? (currentPeriodEnd as { toDate: () => Date }).toDate()
            : undefined;

      return {
        tier: userData.subscriptionTier as SubscriptionTier,
        status: userData.subscriptionStatus as SubscriptionStatus | undefined,
        currentPeriodEnd: currentPeriodEndDate,
        receiptUsageThisMonth: userData.receiptUsageThisMonth || 0,
        receiptLimit:
          userData.subscriptionTier === SubscriptionTier.FREE ? this.FREE_TIER_LIMIT : null,
      };
    } catch (error) {
      logger.error('Error getting subscription', { userId, error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get subscription', 500);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  public async handleWebhook(
    payload: string | Buffer,
    signature: string
  ): Promise<{ received: boolean }> {
    try {
      if (!config.stripe.webhookSecret) {
        throw new AppError('Webhook secret not configured', 503);
      }

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      logger.info('Webhook event received', { type: event.type, id: event.id });

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook handling error', { error });
      throw error;
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.userId;
      if (!userId) {
        logger.error('No userId in checkout session metadata', { sessionId: session.id });
        return;
      }

      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      // Get subscription details
      const subscription = (await this.stripe.subscriptions.retrieve(
        subscriptionId
      )) as StripeSubscriptionWithPeriods;

      // Update user profile
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      await userRef.update({
        stripeCustomerId: customerId,
        subscriptionId: subscriptionId,
        subscriptionTier: SubscriptionTier.PRO,
        subscriptionStatus: subscription.status as SubscriptionStatus,
        currentPeriodEnd: new Date(
          (subscription.current_period_end || subscription.billing_cycle_anchor) * 1000
        ),
        receiptUsageThisMonth: 0,
        usagePeriodStart: new Date(
          (subscription.current_period_start || subscription.created) * 1000
        ),
        updatedAt: new Date(),
      });

      logger.info('Subscription activated', { userId, subscriptionId });
    } catch (error) {
      logger.error('Error handling checkout completed', { error });
    }
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const usersRef = this.getDb().collection(this.usersCollection);
      const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (querySnapshot.empty) {
        logger.error('No user found for Stripe customer', { customerId });
        return;
      }

      const userDoc = querySnapshot.docs[0];

      // Determine tier based on subscription status
      let tier = SubscriptionTier.FREE;
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        tier = SubscriptionTier.PRO;
      }

      const subscriptionWithPeriods = subscription as StripeSubscriptionWithPeriods;

      // Update user profile
      await userDoc.ref.update({
        subscriptionId: subscription.id,
        subscriptionTier: tier,
        subscriptionStatus: subscription.status as SubscriptionStatus,
        currentPeriodEnd: new Date(
          (subscriptionWithPeriods.current_period_end || subscription.billing_cycle_anchor) * 1000
        ),
        updatedAt: new Date(),
      });

      logger.info('Subscription updated', { userId: userDoc.id, status: subscription.status });
    } catch (error) {
      logger.error('Error handling subscription updated', { error });
    }
  }

  /**
   * Handle subscription deleted/canceled
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customerId = subscription.customer as string;

      // Find user by Stripe customer ID
      const usersRef = this.getDb().collection(this.usersCollection);
      const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (querySnapshot.empty) {
        logger.error('No user found for Stripe customer', { customerId });
        return;
      }

      const userDoc = querySnapshot.docs[0];

      // Downgrade to free tier
      await userDoc.ref.update({
        subscriptionTier: SubscriptionTier.FREE,
        subscriptionStatus: 'canceled',
        receiptUsageThisMonth: 0,
        usagePeriodStart: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Subscription canceled, downgraded to free tier', { userId: userDoc.id });
    } catch (error) {
      logger.error('Error handling subscription deleted', { error });
    }
  }

  /**
   * Handle payment succeeded (renewal)
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;
      const invoiceWithSub = invoice as StripeInvoiceWithSubscription;
      const subscriptionId = invoiceWithSub.subscription;

      if (!subscriptionId) {
        return;
      }

      // Find user by Stripe customer ID
      const usersRef = this.getDb().collection(this.usersCollection);
      const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (querySnapshot.empty) {
        logger.error('No user found for Stripe customer', { customerId });
        return;
      }

      const userDoc = querySnapshot.docs[0];

      // Get subscription details
      const subscription = (await this.stripe.subscriptions.retrieve(
        subscriptionId
      )) as StripeSubscriptionWithPeriods;

      // Reset usage for new billing period
      await userDoc.ref.update({
        receiptUsageThisMonth: 0,
        usagePeriodStart: new Date(
          (subscription.current_period_start || subscription.created) * 1000
        ),
        currentPeriodEnd: new Date(
          (subscription.current_period_end || subscription.billing_cycle_anchor) * 1000
        ),
        subscriptionStatus: subscription.status as SubscriptionStatus,
        updatedAt: new Date(),
      });

      logger.info('Payment succeeded, usage reset', { userId: userDoc.id });
    } catch (error) {
      logger.error('Error handling payment succeeded', { error });
    }
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId = invoice.customer as string;

      // Find user by Stripe customer ID
      const usersRef = this.getDb().collection(this.usersCollection);
      const querySnapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();

      if (querySnapshot.empty) {
        logger.error('No user found for Stripe customer', { customerId });
        return;
      }

      const userDoc = querySnapshot.docs[0];

      // Update subscription status
      await userDoc.ref.update({
        subscriptionStatus: 'past_due',
        updatedAt: new Date(),
      });

      logger.warn('Payment failed', { userId: userDoc.id, invoiceId: invoice.id });
    } catch (error) {
      logger.error('Error handling payment failed', { error });
    }
  }

  /**
   * Check if user can upload receipt (within limits)
   */
  public async canUploadReceipt(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return { allowed: false, reason: 'User not found' };
      }

      const userData = userDoc.data() as UserProfile;

      // Pro users have unlimited access
      if (userData.subscriptionTier === SubscriptionTier.PRO) {
        return { allowed: true };
      }

      // Free tier users have a monthly limit
      if (userData.subscriptionTier === SubscriptionTier.FREE) {
        const usage = userData.receiptUsageThisMonth || 0;
        if (usage >= this.FREE_TIER_LIMIT) {
          return {
            allowed: false,
            reason: `Free tier limit of ${this.FREE_TIER_LIMIT} receipts per month reached. Upgrade to Pro for unlimited access.`,
          };
        }
        return { allowed: true };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Error checking receipt limit', { userId, error });
      return { allowed: false, reason: 'Error checking limit' };
    }
  }

  /**
   * Increment receipt usage for a user
   */
  public async incrementReceiptUsage(userId: string): Promise<void> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const userData = userDoc.data() as UserProfile;

      // Only track usage for free tier
      if (userData.subscriptionTier === SubscriptionTier.FREE) {
        await userRef.update({
          receiptUsageThisMonth: (userData.receiptUsageThisMonth || 0) + 1,
          updatedAt: new Date(),
        });

        logger.info('Receipt usage incremented', {
          userId,
          usage: (userData.receiptUsageThisMonth || 0) + 1,
        });
      }
    } catch (error) {
      logger.error('Error incrementing receipt usage', { userId, error });
      // Don't throw error to not block receipt creation
    }
  }
}
