export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  // Future tiers - not yet implemented
  PREMIUM = 'premium', // Reserved for future use
  ENTERPRISE = 'enterprise', // Reserved for future use
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPeriodEnd?: Date;
  receiptUsageThisMonth: number;
  usagePeriodStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserProfileDto {
  displayName?: string;
  subscriptionTier?: SubscriptionTier;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
}
