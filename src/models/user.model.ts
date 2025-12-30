export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
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
