/**
 * Unit tests for user models and types
 */

import {
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
  UserProfile,
  UpdateUserProfileDto,
  AuthenticatedUser,
} from '../../models/user.model';

describe('User Models', () => {
  describe('UserRole enum', () => {
    it('should have correct role values', () => {
      expect(UserRole.USER).toBe('user');
      expect(UserRole.ADMIN).toBe('admin');
    });

    it('should have all expected roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(2);
      expect(roles).toContain('user');
      expect(roles).toContain('admin');
    });
  });

  describe('SubscriptionTier enum', () => {
    it('should have correct tier values', () => {
      expect(SubscriptionTier.FREE).toBe('free');
      expect(SubscriptionTier.PRO).toBe('pro');
      expect(SubscriptionTier.PREMIUM).toBe('premium');
      expect(SubscriptionTier.ENTERPRISE).toBe('enterprise');
    });

    it('should have all expected tiers', () => {
      const tiers = Object.values(SubscriptionTier);
      expect(tiers).toHaveLength(4);
      expect(tiers).toContain('free');
      expect(tiers).toContain('pro');
      expect(tiers).toContain('premium');
      expect(tiers).toContain('enterprise');
    });
  });

  describe('SubscriptionStatus enum', () => {
    it('should have correct status values', () => {
      expect(SubscriptionStatus.ACTIVE).toBe('active');
      expect(SubscriptionStatus.CANCELED).toBe('canceled');
      expect(SubscriptionStatus.PAST_DUE).toBe('past_due');
      expect(SubscriptionStatus.TRIALING).toBe('trialing');
      expect(SubscriptionStatus.UNPAID).toBe('unpaid');
      expect(SubscriptionStatus.INCOMPLETE).toBe('incomplete');
    });

    it('should have all expected statuses', () => {
      const statuses = Object.values(SubscriptionStatus);
      expect(statuses).toHaveLength(6);
    });
  });

  describe('UserProfile interface', () => {
    it('should create a complete user profile with all fields', () => {
      const profile: UserProfile = {
        userId: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.PRO,
        stripeCustomerId: 'cus_test123',
        subscriptionId: 'sub_test123',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date('2024-02-15'),
        receiptUsageThisMonth: 25,
        usagePeriodStart: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      expect(profile.userId).toBe('user123');
      expect(profile.email).toBe('test@example.com');
      expect(profile.subscriptionTier).toBe(SubscriptionTier.PRO);
      expect(profile.receiptUsageThisMonth).toBe(25);
    });

    it('should create a minimal free tier user profile', () => {
      const profile: UserProfile = {
        userId: 'user456',
        email: 'free@example.com',
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.FREE,
        receiptUsageThisMonth: 5,
        usagePeriodStart: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.subscriptionTier).toBe(SubscriptionTier.FREE);
      expect(profile.displayName).toBeUndefined();
      expect(profile.stripeCustomerId).toBeUndefined();
      expect(profile.subscriptionId).toBeUndefined();
      expect(profile.subscriptionStatus).toBeUndefined();
    });

    it('should create an admin user profile', () => {
      const profile: UserProfile = {
        userId: 'admin123',
        email: 'admin@example.com',
        displayName: 'Admin User',
        role: UserRole.ADMIN,
        subscriptionTier: SubscriptionTier.FREE,
        receiptUsageThisMonth: 0,
        usagePeriodStart: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.role).toBe(UserRole.ADMIN);
    });

    it('should track usage period correctly', () => {
      const usagePeriodStart = new Date('2024-01-01');
      const profile: UserProfile = {
        userId: 'user789',
        email: 'user@example.com',
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.PRO,
        receiptUsageThisMonth: 50,
        usagePeriodStart,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.usagePeriodStart).toBe(usagePeriodStart);
      expect(profile.receiptUsageThisMonth).toBe(50);
    });
  });

  describe('UpdateUserProfileDto interface', () => {
    it('should create a DTO with displayName only', () => {
      const dto: UpdateUserProfileDto = {
        displayName: 'Updated Name',
      };

      expect(dto.displayName).toBe('Updated Name');
      expect(dto.subscriptionTier).toBeUndefined();
    });

    it('should create a DTO with subscriptionTier only', () => {
      const dto: UpdateUserProfileDto = {
        subscriptionTier: SubscriptionTier.PRO,
      };

      expect(dto.subscriptionTier).toBe(SubscriptionTier.PRO);
      expect(dto.displayName).toBeUndefined();
    });

    it('should create a DTO with both fields', () => {
      const dto: UpdateUserProfileDto = {
        displayName: 'New Name',
        subscriptionTier: SubscriptionTier.PREMIUM,
      };

      expect(dto.displayName).toBe('New Name');
      expect(dto.subscriptionTier).toBe(SubscriptionTier.PREMIUM);
    });

    it('should create an empty DTO for partial updates', () => {
      const dto: UpdateUserProfileDto = {};
      expect(Object.keys(dto)).toHaveLength(0);
    });
  });

  describe('AuthenticatedUser interface', () => {
    it('should create an authenticated user with all fields', () => {
      const authUser: AuthenticatedUser = {
        uid: 'firebase-uid-123',
        email: 'user@example.com',
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.PRO,
      };

      expect(authUser.uid).toBe('firebase-uid-123');
      expect(authUser.email).toBe('user@example.com');
      expect(authUser.role).toBe(UserRole.USER);
      expect(authUser.subscriptionTier).toBe(SubscriptionTier.PRO);
    });

    it('should create an authenticated admin user', () => {
      const authUser: AuthenticatedUser = {
        uid: 'firebase-admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        subscriptionTier: SubscriptionTier.FREE,
      };

      expect(authUser.role).toBe(UserRole.ADMIN);
    });

    it('should create an authenticated free tier user', () => {
      const authUser: AuthenticatedUser = {
        uid: 'firebase-free-123',
        email: 'free@example.com',
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.FREE,
      };

      expect(authUser.subscriptionTier).toBe(SubscriptionTier.FREE);
    });
  });
});
