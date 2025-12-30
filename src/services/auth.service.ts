import { getFirestore } from '../config/firebase';
import {
  UserProfile,
  UserRole,
  SubscriptionTier,
  UpdateUserProfileDto,
} from '../models/user.model';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  private usersCollection = 'users';

  private getDb() {
    return getFirestore();
  }

  public async getOrCreateUserProfile(userId: string, email: string): Promise<UserProfile> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const data = userDoc.data();
        if (!data) {
          throw new AppError('User profile data is invalid', 500);
        }
        return {
          userId: userDoc.id,
          email: data.email,
          displayName: data.displayName,
          role: data.role as UserRole,
          subscriptionTier: data.subscriptionTier as SubscriptionTier,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        };
      }

      // Create new user profile
      const now = new Date();
      const newProfile: Omit<UserProfile, 'userId'> = {
        email,
        displayName: email.split('@')[0],
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.FREE,
        createdAt: now,
        updatedAt: now,
      };

      await userRef.set(newProfile);

      logger.info('New user profile created', { userId, email });

      return {
        userId,
        ...newProfile,
      };
    } catch (error) {
      logger.error('Error getting or creating user profile', { userId, email, error });
      throw new AppError('Failed to retrieve user profile', 500);
    }
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return null;
      }

      const data = userDoc.data();
      if (!data) {
        throw new AppError('User profile data is invalid', 500);
      }
      return {
        userId: userDoc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role as UserRole,
        subscriptionTier: data.subscriptionTier as SubscriptionTier,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
    } catch (error) {
      logger.error('Error fetching user profile', { userId, error });
      throw new AppError('Failed to fetch user profile', 500);
    }
  }

  public async updateUserProfile(
    userId: string,
    updates: UpdateUserProfileDto
  ): Promise<UserProfile> {
    try {
      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new AppError('User not found', 404);
      }

      const updateData: Record<string, unknown> = {
        ...updates,
        updatedAt: new Date(),
      };

      await userRef.update(updateData);

      logger.info('User profile updated', { userId, updates });

      const updatedProfile = await this.getUserProfile(userId);
      if (!updatedProfile) {
        throw new AppError('Failed to retrieve updated profile', 500);
      }

      return updatedProfile;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error updating user profile', { userId, updates, error });
      throw new AppError('Failed to update user profile', 500);
    }
  }

  public async registerUser(
    userId: string,
    email: string,
    displayName?: string
  ): Promise<UserProfile> {
    try {
      // Check if user already exists
      const existingProfile = await this.getUserProfile(userId);
      if (existingProfile) {
        throw new AppError('User already registered', 409);
      }

      // Create new user profile
      const now = new Date();
      const newProfile: Omit<UserProfile, 'userId'> = {
        email,
        displayName: displayName || email.split('@')[0],
        role: UserRole.USER,
        subscriptionTier: SubscriptionTier.FREE,
        createdAt: now,
        updatedAt: now,
      };

      const userRef = this.getDb().collection(this.usersCollection).doc(userId);
      await userRef.set(newProfile);

      logger.info('User registered successfully', { userId, email });

      return {
        userId,
        ...newProfile,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error registering user', { userId, email, error });
      throw new AppError('Failed to register user', 500);
    }
  }
}
